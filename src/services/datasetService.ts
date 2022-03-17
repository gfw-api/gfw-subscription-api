import Subscription, { DatasetQuery, ISubscription } from 'models/subscription';
import { RWAPIMicroservice } from 'rw-api-microservice-node';
import MailService, { DatasetEmail } from 'services/mailService';
import { Deserializer } from 'jsonapi-serializer';
import logger from 'logger';
import request from 'request';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import julian from 'julian';

type SubscriptionQuery = Record<string, {
    type: string
    timestamp: Date,
    data: Record<string, any>
}>

class DatasetService {

    // @todo: type return properly
    static async runSubscriptionQuery(subscription: ISubscription, queryType: string): Promise<SubscriptionQuery[] | void> {
        logger.info('Iterate over datasetsQuery of each subs');
        const queryData: SubscriptionQuery[] = [];
        for (let j: number = 0; j < subscription.datasetsQuery.length; j++) {
            try {
                const datasetQuery: DatasetQuery = subscription.datasetsQuery[j];
                // for each subs, each dataset query -> get dataset, get geostoreId from area and finally exec the desired query
                const dataset: Record<string, any> = await DatasetService.getDataset(datasetQuery.id);
                if (!dataset) {
                    logger.error('Error getting dataset of subs');
                    continue;
                }
                // geostore from different sources
                let geostoreId: string = null;
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

                const result: Record<string, any> = await DatasetService.executeQuery(
                    dataset.subscribable[datasetQuery.type][queryType],
                    datasetQuery.lastSentDate,
                    new Date(),
                    geostoreId,
                    dataset.tableName,
                    datasetQuery.threshold
                );
                // for data endpoint
                if (queryType === 'dataQuery') {
                    const queryDataObject: Partial<SubscriptionQuery> = {};
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
                } else {
                    logger.debug('Result: ', result);
                    try {
                        if (result.data && result.data.length === 1 && result.data[0].value && result.data[0].value > 0) {
                            // getting metadata first
                            const metadata: Record<string, any> = await DatasetService.getMetadata(datasetQuery.id, subscription.application, subscription.language);
                            const areaName: string = subscription.params.area ? await DatasetService.getAreaName(subscription.params.area) : '';
                            const datasetName: string = metadata[0].attributes.info.name || dataset.attributes.name || dataset.name;
                            const data: DatasetEmail = {
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
                                let template: string = 'dataset-rw';
                                if (subscription.env && subscription.env !== 'production') {
                                    template += `-${subscription.env}`;
                                }
                                MailService.sendDatasetEmail(template, data, [{ address: subscription.resource.content }], 'rw'); // sender='rw'
                            }

                            // Execute URL notification - POSTing to webhook
                            if (subscription.resource.type === 'URL') {
                                // POST to URL configured in subscription.resource.content
                                request.post(subscription.resource.content, { json: data }, (error: Error, res: request.Response, body: Record<string, any>) => {
                                    if (res && res.statusCode < 400) {
                                        logger.info(`Successfully POSTed to subscription web-hook with status code ${res.statusCode}:`, subscription, body);
                                        return;
                                    }

                                    // eslint-disable-next-line max-len
                                    logger.warn(`Error in call to subscription webhook. Subscription id: ${subscription.id} || POST url: ${subscription.resource.content} || POST body: ${JSON.stringify(data)} || Response code: ${res && res.statusCode} || Response body: ${body && JSON.stringify(body)} || error: ${error && JSON.stringify(error)}`);
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
    static async processSubscriptionData(subscriptionId: string): Promise<SubscriptionQuery[] | void> {
        const subscription: ISubscription = await Subscription.findById(subscriptionId).exec();
        return DatasetService.runSubscriptionQuery(subscription, 'dataQuery');
    }

    static async processSubscriptions(): Promise<void> {
        logger.info('Processing dataset subs');
        logger.info('Getting datasetsQuery subscriptions');
        const subscriptions: ISubscription[] = await Subscription.find({
            confirmed: true,
            datasetsQuery: { $exists: true, $not: { $size: 0 } }
        }).exec();
        logger.info('Iterate over subs');
        for (let i: number = 0; i < subscriptions.length; i++) {
            const subscription: ISubscription = subscriptions[i];
            await DatasetService.runSubscriptionQuery(subscription, 'subscriptionQuery');
        }
    }

    static async getDataset(datasetId: string): Promise<Record<string, any> | null> {
        try {
            const result: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
                uri: `/v1/dataset/${datasetId}`,
                method: 'GET',
                json: true
            });
            return result.data.attributes;
        } catch (error) {
            logger.error(error);
            return null;
        }
    }

    static async getMetadata(datasetId: string, application: string, language: string): Promise<Record<string, any> | null> {
        try {
            const result: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
                uri: `/v1/dataset/${datasetId}/metadata?application=${application}&language=${language}`,
                method: 'GET',
                json: true
            });
            return result.data;
        } catch (error) {
            logger.error(error);
            return null;
        }
    }

    static async getGeostoreIdByArea(idArea: string): Promise<string | null> {
        try {
            logger.info('Obtaining area with id: ', idArea);
            const areaResult: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
                uri: `/v1/area/${idArea}`,
                method: 'GET',
                json: true
            });

            const area: Record<string, any> = await new Deserializer({
                keyForAttribute: 'camelCase'
            }).deserialize(areaResult);
            logger.info('Area Result', area);
            if (area.geostore) {
                return area.geostore;
            }
            let uri: string = '/v1/geostore';
            if (area.use && area.use.name) {
                uri += `/use/${area.use.name}/${area.use.id}`;
            } else if (area.wdpaid) {
                uri += `/wdpa/${area.wdpaid}`;
            } else if (area.iso) {
                if (area.iso && area.iso.region) {
                    if (area.iso.subregion) {
                        uri += `/admin/${area.iso.country}/${area.iso.region}/${area.iso.subregion}`;
                    } else {
                        uri += `/admin/${area.iso.country}/${area.iso.region}`;
                    }
                } else {
                    uri += `/admin/${area.iso.country}`;
                }
            }
            try {
                logger.info('Uri', uri);
                const result: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
                    uri,
                    method: 'GET',
                    json: true
                });
                const geostore: Record<string, any> = await new Deserializer({
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

    static async getAreaName(idArea: string): Promise<string | null> {
        try {
            logger.info('Obtaining area with id: ', idArea);
            const result: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
                uri: `/v1/area/${idArea}`,
                method: 'GET',
                json: true
            });
            const area: Record<string, any> = await new Deserializer({
                keyForAttribute: 'camelCase'
            }).deserialize(result);
            return area.name;
        } catch (error) {
            logger.error(error);
            return null;
        }
    }

    static async getGeostoreIdByParams(params: Record<string, any>): Promise<string | null> {
        try {
            let uri: string = '/v1/geostore';
            if (params.use && params.useid) {
                uri += `/use/${params.use}/${params.useid}`;
            } else if (params.wdpaid) {
                uri += `/wdpa/${params.wdpaid}`;
            } else if (params.iso && params.iso.country) {
                if (params.iso && params.iso.region) {
                    if (params.iso.subregion) {
                        uri += `/admin/${params.iso.country}/${params.iso.region}/${params.iso.subregion}`;
                    } else {
                        uri += `/admin/${params.iso.country}/${params.iso.region}`;
                    }
                } else {
                    uri += `/admin/${params.iso.country}`;
                }
            }
            try {
                logger.info('Uri', uri);
                const result: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
                    uri,
                    method: 'GET',
                    json: true
                });
                const geostore: Record<string, any> = await new Deserializer({
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

    // @todo: type return properly
    static async executeQuery(query: string, beginDate: Date, endDate: Date, geostoreId: string, tableName: string, threshold: number): Promise<Record<string, any> | null> {
        const julianDayBegin: number = julian.toJulianDay(beginDate);
        const yearBegin: number = beginDate.getFullYear();
        const julianDayEnd: number = julian.toJulianDay(endDate);
        const yearEnd: number = endDate.getFullYear();
        const finalQuery: string = query.replace('{{begin}}', beginDate.toISOString().slice(0, 10)).replace('{{end}}', endDate.toISOString().slice(0, 10))
            .replace('{{julianDayBegin}}', julianDayBegin.toString()).replace('{{yearBegin}}', yearBegin.toString())
            .replace('{{julianDayEnd}}', julianDayEnd.toString())
            .replace('{{yearEnd}}', yearEnd.toString());
        logger.debug('Doing query: ', finalQuery);
        try {
            return RWAPIMicroservice.requestToMicroservice({
                uri: '/v1/query',
                qs: {
                    sql: finalQuery,
                    threshold,
                    geostore: geostoreId
                },
                method: 'GET',
                json: true
            });
        } catch (error) {
            logger.error(error);
            return null;
        }
    }

    // @Todo: this might return a Date instead of a string
    static async getLastDateFromDataset(datasetSlug: string, datasetMainDateField: string): Promise<Date> {
        const query: string = `select max(${datasetMainDateField}) as lastdate
                               from ${datasetSlug}`;
        logger.debug('Doing query: ', query);
        try {
            const result: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
                uri: '/v1/query',
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

export default DatasetService;
