'use strict';

const Subscription = require('models/subscription');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const MailService = require('services/mailService');
var JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
const julian = require('julian');
const logger = require('logger');

var deserializer = function(obj) {
    return function(callback) {
        new JSONAPIDeserializer({keyForAttribute: 'camelCase'}).deserialize(obj, callback);
    };
};

class DatasetService {

    static * processSubscriptions(){
        logger.info('Processing dataset subs');
        logger.info('Getting datasetsQuery subscriptions');
        const subscriptions = yield Subscription.find({
            confirmed: true,
            datasetsQuery: { $exists: true, $not: {$size: 0} }
        }).exec();
        logger.info('Iterate over subs');
        for (let i = 0; i < subscriptions.length; i++) {
            const subscription = subscriptions[i];
            logger.info('Iterate over datasetsQuery of each subs');
            for (let j = 0; j < subscription.datasetsQuery.length; j++) {
                try {
                    const datasetQuery = subscription.datasetsQuery[j];
                    // for each subs, each dataset query -> get dataset, get geostoreId from area and finally exec the desired query
                    const dataset = yield DatasetService.getDataset(datasetQuery.id);
                    if (!dataset) {
                        logger.error('Error getting dataset of subs');
                        break;
                    }
                    // geostore from different sources
                    let geostoreId = null;
                    if (subscription.params.area) {
                        geostoreId = yield DatasetService.getGeostoreIdByArea(subscription.params.area);
                    } else if (subscription.params.geostore) {
                        geostoreId = subscription.params.geostore;
                    } else {
                        geostoreId = yield DatasetService.getGeostoreIdByParams(subscription.params);
                    }
                    if (!geostoreId) {
                        logger.error('Error getting geostore of area');
                        break;
                    }
                    const result = yield DatasetService.executeQuery(dataset.subscribable[datasetQuery.type].subscriptionQuery, datasetQuery.lastSentDate, new Date(), geostoreId, dataset.tableName, datasetQuery.threshold);
                    if (!result) {
                        logger.error('Error processing subs query');
                        break;
                    } else {
                        logger.debug('Result: ', result);
                        try {
                            if (result.data && result.data.length === 1 && result.data[0].value && result.data[0].value > 0) {
                                // sending mail
                                if (subscription.resource.type === 'EMAIL') {

                                        const data = {
                                            value: result.data[0].value,
                                            name: dataset.name,
                                            beginDate: datasetQuery.lastSentDate.toISOString().slice(0, 10),
                                            endDate: new Date().toISOString().slice(0, 10)
                                        };
                                        logger.debug('Sending mail with data', data );
                                        MailService.sendMail('dataset', data , [{ address: subscription.resource.content }]);

                                } else {
                                    // @TODO resource.type === 'WEBHOOK'?
                                }
                                // update subs
                                if (dataset.mainDateField) {
                                  subscription.datasetsQuery[j].lastSentDate = yield DatasetService.getLastDateFromDataset(dataset.slug, dataset.mainDateField);
                                } else {
                                  subscription.datasetsQuery[j].lastSentDate = new Date();
                                }
                                subscription.datasetsQuery[j].historical = subscription.datasetsQuery[j].historical.concat([{
                                  value: result.data[0].value,
                                  date: new Date()
                                }]);
                                yield subscriptions[i].save();
                                logger.debug('Finished subscription');
                            }
                        } catch (e) {
                            logger.error(e);
                            break;
                        }
                    }
                } catch (e) {
                    logger.error(e);
                }
            }
        }
    }

    static * getDataset(idDataset){
        try {
            const result = yield ctRegisterMicroservice.requestToMicroservice({
                uri: `/dataset/${idDataset}`,
                method: 'GET',
                json: true
            });
            return result.data.attributes;
        } catch(error) {
            logger.error(error);
            return null;
        }
    }

    static * getGeostoreIdByArea(idArea){
        try {
            logger.info('Obtaining area with id: ', idArea);
            const result = yield ctRegisterMicroservice.requestToMicroservice({
                uri: `/area/${idArea}`,
                method: 'GET',
                json: true
            });

            const area = yield deserializer(result);
            logger.info('Area Result', area);
            if (area.geostore) {
                return area.geostore;
            }
            let uri = '/geostore';
            if (area.use && area.use.name) {
                uri += `/use/${area.use.name}/${area.use.id}`;
            } else if (area.wdpaid){
                uri += `/wdpa/${area.wdpaid}`;
            } else {
                if (area.iso) {
                    if (area.iso && area.iso.region) {
                        uri += `/admin/${area.iso.country}/${area.iso.region}`;
                    } else {
                        uri += `/admin/${area.iso.country}`;
                    }
                 }
            }
            try {
                logger.info('Uri', uri);
                const result = yield ctRegisterMicroservice.requestToMicroservice({
                    uri: uri,
                    method: 'GET',
                    json: true
                });
                const geostore = yield deserializer(result);
                return geostore.id;
            } catch(error) {
                logger.error(error);
                return null;
            }
        } catch(error) {
            logger.error(error);
            return null;
        }
    }

    static * getGeostoreIdByParams(params){
        try {
            let uri = '/geostore';
            if (params.use && params.useid) {
                uri += `/use/${params.use}/${params.useid}`;
            } else if (params.wdpaid){
                uri += `/wdpa/${params.wdpaid}`;
            } else {
                if (params.iso && params.iso.country) {
                    if (params.iso && params.iso.region) {
                        uri += `/admin/${params.iso.country}/${params.iso.region}`;
                    } else {
                        uri += `/admin/${params.iso.country}`;
                    }
                 }
            }
            try {
                logger.info('Uri', uri);
                const result = yield ctRegisterMicroservice.requestToMicroservice({
                    uri: uri,
                    method: 'GET',
                    json: true
                });
                const geostore = yield deserializer(result);
                return geostore.id;
            } catch(error) {
                logger.error(error);
                return null;
            }
        } catch(error) {
            logger.error(error);
            return null;
        }
    }

    static * executeQuery(query, beginDate, endDate, geostoreId, tableName, threshold){

        let julianDayBegin = julian.toJulianDay(beginDate);
        let yearBegin = beginDate.getFullYear();
        let julianDayEnd = julian.toJulianDay(endDate);
        let yearEnd = endDate.getFullYear();
        let finalQuery = query.replace('{{begin}}', beginDate.toISOString().slice(0,10)).replace('{{end}}', endDate.toISOString().slice(0,10))
          .replace('{{julianDayBegin}}', julianDayBegin).replace('{{yearBegin}}', yearBegin).replace('{{julianDayEnd}}', julianDayEnd).replace('{{yearEnd}}', yearEnd);
        logger.debug('Doing query: ', finalQuery);
        try {
            const result = yield ctRegisterMicroservice.requestToMicroservice({
                uri: '/query',
                qs: {
                    sql: finalQuery,
                    threshold,
                    geostore: geostoreId
                },
                method: 'GET',
                json: true
            });
            return result;
        } catch(error) {
            logger.error(error);
            return null;
        }
    }

    static * getLastDateFromDataset(datasetSlug, datasetMainDateField){

        const query = `select max(${datasetMainDateField}) as lastdate from ${datasetSlug})`;
        logger.debug('Doing query: ', query);
        try {
            const result = yield ctRegisterMicroservice.requestToMicroservice({
                uri: '/query',
                qs: {
                    sql: query
                },
                method: 'GET',
                json: true
            });
            return result.data[0].lastdate;
        } catch(error) {
            logger.error(error);
            return null;
        }
    }

}


module.exports = DatasetService;
