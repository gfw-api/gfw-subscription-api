/* eslint-disable no-continue */
const Subscription = require('models/subscription');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const MailService = require('services/mailService');
const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
const julian = require('julian');
const logger = require('logger');
const request = require('request');

class DatasetService {

    // eslint-disable-next-line consistent-return
    static async runSubscriptionQuery(subscription, queryType) {
        logger.info('Iterate over datasetsQuery of each subs');
        const queryData = [];
        for (let j = 0; j < subscription.datasetsQuery.length; j++) {
            try {
                const datasetQuery = subscription.datasetsQuery[j];
                // for each subs, each dataset query -> get dataset, get geostoreId from area and finally exec the desired query
                const dataset = await DatasetService.getDataset(datasetQuery.id);
                if (!dataset) {
                    logger.error('Error getting dataset of subs');
                    continue;
                }
                // geostore from different sources
                let geostoreId = null;
                if (subscription.params.area) {
                    geostoreId = await DatasetService.getGeostoreIdByArea(subscription.params.area);
                } else if (subscription.params.geostore) {
                    geostoreId = subscription.params.geostore;
                } else {
                    geostoreId = await DatasetService.getGeostoreIdByParams(subscription.params);
                }
                if (!geostoreId) {
                    logger.error('Error getting geostore of area');
                    continue;
                }

                const result = await DatasetService.executeQuery(
                    dataset.subscribable[datasetQuery.type][queryType],
                    datasetQuery.lastSentDate,
                    new Date(),
                    geostoreId,
                    dataset.tableName,
                    datasetQuery.threshold
                );
                // for data endpoint
                if (queryType === 'dataQuery') {
                    const queryDataObject = {};
                    queryDataObject[`${datasetQuery.id}`] = {
                        type: datasetQuery.type,
                        timestamp: datasetQuery.lastSentDate,
                        data: result.data
                    };
                    queryData.push(queryDataObject);
                    continue; // not sending emails if dataQuery
                }
                if (!result) {
                    logger.error('Error processing subs query');
                    continue;
                } else {
                    logger.debug('Result: ', result);
                    try {
                        if (result.data && result.data.length === 1 && result.data[0].value && result.data[0].value > 0) {
                            // getting metadata first
                            const metadata = await DatasetService.getMetadata(datasetQuery.id, subscription.application, subscription.language);
                            const areaName = subscription.params.area ? await DatasetService.getAreaName(subscription.params.area) : '';
                            const datasetName = metadata[0].attributes.info.name || dataset.attributes.name || dataset.name;
                            const data = {
                                subject: subscription.name ? subscription.name : `${datasetQuery.type} in ${areaName} above ${datasetQuery.threshold}`,
                                datasetName,
                                datasetId: datasetQuery.id,
                                datasetSummary: metadata[0].attributes.info.functions,
                                areaId: subscription.params.area ? subscription.params.area : '',
                                areaName,
                                alertName: subscription.name ? subscription.name : `${datasetQuery.type} in ${areaName} above ${datasetQuery.threshold}`,
                                alertType: datasetQuery.type,
                                alertBeginDate: datasetQuery.lastSentDate.toISOString().slice(0, 10),
                                alertEndDate: new Date().toISOString().slice(0, 10),
                                alertResult: result.data[0].value
                            };

                            // Execute EMAIL notification - sending an email
                            if (subscription.resource.type === 'EMAIL') {
                                logger.debug('Sending mail with data', data);
                                let template = 'dataset-rw';
                                if (subscription.env && subscription.env !== 'production') {
                                    template += `-${subscription.env}`;
                                }
                                MailService.sendMail(template, data, [{ address: subscription.resource.content }], 'rw'); // sender='rw'
                            }

                            // Execute URL notification - POSTing to webhook
                            if (subscription.resource.type === 'URL') {
                                // POST to URL configured in subscription.resource.content
                                request.post(subscription.resource.content, { json: data }, (error, res, body) => {
                                    if (res && res.statusCode === 200) {
                                        logger.info('Successfully POSTed to subscription web-hook: ', res.statusCode, body);
                                    } else if (res && res.statusCode !== 200) {
                                        logger.debug(`POST to subscription web-hook returned status code ${res.statusCode}`, body);
                                    }

                                    if (error) {
                                        logger.warn('Error POSTing to subscription web-hook: ', error);
                                    }
                                });
                            }

                            // update subs
                            if (dataset.mainDateField) {
                                subscription.datasetsQuery[j].lastSentDate = await DatasetService.getLastDateFromDataset(dataset.slug, dataset.mainDateField);
                            } else {
                                subscription.datasetsQuery[j].lastSentDate = new Date();
                            }
                            subscription.datasetsQuery[j].historical = subscription.datasetsQuery[j].historical.concat([{
                                value: result.data[0].value,
                                date: new Date()
                            }]);
                            await subscription.save();
                            logger.debug('Finished subscription');
                        }
                    } catch (e) {
                        logger.error(e);
                        continue;
                    }
                }
            } catch (e) {
                logger.error(e);
            }
        }
        if (queryType === 'dataQuery') {
            return queryData;
        }
    }

    // for data endpoint
    static async processSubscriptionData(subscriptionId) {
        const subscription = await Subscription.findById(subscriptionId).exec();
        const data = await DatasetService.runSubscriptionQuery(subscription, 'dataQuery');
        return data;
    }


    static async processSubscriptions() {
        logger.info('Processing dataset subs');
        logger.info('Getting datasetsQuery subscriptions');
        const subscriptions = await Subscription.find({
            confirmed: true,
            datasetsQuery: { $exists: true, $not: { $size: 0 } }
        }).exec();
        logger.info('Iterate over subs');
        for (let i = 0; i < subscriptions.length; i++) {
            const subscription = subscriptions[i];
            await DatasetService.runSubscriptionQuery(subscription, 'subscriptionQuery');
        }
    }

    static async getDataset(datasetId) {
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri: `/dataset/${datasetId}`,
                method: 'GET',
                json: true
            });
            return result.data.attributes;
        } catch (error) {
            logger.error(error);
            return null;
        }
    }

    static async getMetadata(datasetId, application, language) {
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri: `/dataset/${datasetId}/metadata?application=${application}&language=${language}`,
                method: 'GET',
                json: true
            });
            return result.data;
        } catch (error) {
            logger.error(error);
            return null;
        }
    }

    static async getGeostoreIdByArea(idArea) {
        try {
            logger.info('Obtaining area with id: ', idArea);
            const areaResult = await ctRegisterMicroservice.requestToMicroservice({
                uri: `/area/${idArea}`,
                method: 'GET',
                json: true
            });

            const area = await new JSONAPIDeserializer({
                keyForAttribute: 'camelCase'
            }).deserialize(areaResult);
            logger.info('Area Result', area);
            if (area.geostore) {
                return area.geostore;
            }
            let uri = '/geostore';
            if (area.use && area.use.name) {
                uri += `/use/${area.use.name}/${area.use.id}`;
            } else if (area.wdpaid) {
                uri += `/wdpa/${area.wdpaid}`;
            } else if (area.iso) {
                if (area.iso && area.iso.region) {
                    uri += `/admin/${area.iso.country}/${area.iso.region}`;
                } else {
                    uri += `/admin/${area.iso.country}`;
                }
            }
            try {
                logger.info('Uri', uri);
                const result = await ctRegisterMicroservice.requestToMicroservice({
                    uri,
                    method: 'GET',
                    json: true
                });
                const geostore = await new JSONAPIDeserializer({
                    keyForAttribute: 'camelCase'
                }).deserialize(result);
                return geostore.id;
            } catch (error) {
                logger.error(error);
                return null;
            }
        } catch (error) {
            logger.error(error);
            return null;
        }
    }

    static async getAreaName(idArea) {
        try {
            logger.info('Obtaining area with id: ', idArea);
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri: `/area/${idArea}`,
                method: 'GET',
                json: true
            });
            const area = await new JSONAPIDeserializer({
                keyForAttribute: 'camelCase'
            }).deserialize(result);
            return area.name;
        } catch (error) {
            logger.error(error);
            return null;
        }
    }

    static async getGeostoreIdByParams(params) {
        try {
            let uri = '/geostore';
            if (params.use && params.useid) {
                uri += `/use/${params.use}/${params.useid}`;
            } else if (params.wdpaid) {
                uri += `/wdpa/${params.wdpaid}`;
            } else if (params.iso && params.iso.country) {
                if (params.iso && params.iso.region) {
                    uri += `/admin/${params.iso.country}/${params.iso.region}`;
                } else {
                    uri += `/admin/${params.iso.country}`;
                }
            }
            try {
                logger.info('Uri', uri);
                const result = await ctRegisterMicroservice.requestToMicroservice({
                    uri,
                    method: 'GET',
                    json: true
                });
                const geostore = await new JSONAPIDeserializer({
                    keyForAttribute: 'camelCase'
                }).deserialize(result);
                return geostore.id;
            } catch (error) {
                logger.error(error);
                return null;
            }
        } catch (error) {
            logger.error(error);
            return null;
        }
    }

    static async executeQuery(query, beginDate, endDate, geostoreId, tableName, threshold) {

        const julianDayBegin = julian.toJulianDay(beginDate);
        const yearBegin = beginDate.getFullYear();
        const julianDayEnd = julian.toJulianDay(endDate);
        const yearEnd = endDate.getFullYear();
        const finalQuery = query.replace('{{begin}}', beginDate.toISOString().slice(0, 10)).replace('{{end}}', endDate.toISOString().slice(0, 10))
            .replace('{{julianDayBegin}}', julianDayBegin).replace('{{yearBegin}}', yearBegin)
            .replace('{{julianDayEnd}}', julianDayEnd)
            .replace('{{yearEnd}}', yearEnd);
        logger.debug('Doing query: ', finalQuery);
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
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
        } catch (error) {
            logger.error(error);
            return null;
        }
    }

    static async getLastDateFromDataset(datasetSlug, datasetMainDateField) {

        const query = `select max(${datasetMainDateField}) as lastdate from ${datasetSlug}`;
        logger.debug('Doing query: ', query);
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri: '/query',
                qs: {
                    sql: query
                },
                method: 'GET',
                json: true
            });
            return result.data[0].lastdate;
        } catch (error) {
            logger.error(error);
            return null;
        }
    }

}


module.exports = DatasetService;
