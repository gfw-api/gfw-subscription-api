import logger from 'logger';
import moment from 'moment';
import { RWAPIMicroservice } from 'rw-api-microservice-node';
import { Deserializer } from 'jsonapi-serializer';
import GLADAlertsService from 'services/gfw-data-api/gladAlertsService';
import ViirsAlertsService from 'services/gfw-data-api/viirsAlertsService';
import GladAllService from 'services/gfw-data-api/gladAllService';
import GladLService from 'services/gfw-data-api/gladLService';
import GladS2Service from 'services/gfw-data-api/gladS2Service';
import GladRaddService from 'services/gfw-data-api/gladRaddService';
import { ISubscription } from 'models/subscription';
import { BaseAlert, GladAlert, MonthlySummaryAlert, ViirsActiveFiresAlert } from 'types/analysis.type';

const formatDate = (date: Date): string => moment(date).format('YYYY-MM-DD');

class AnalysisService {

    static #pathFor(subscription: ISubscription): string {
        const params: Record<string, any> = subscription.params || {};

        if (params.iso && params.iso.country) {
            let url: string = `/admin/${params.iso.country}`;

            if (params.iso.region) {
                url += `/${params.iso.region}`;

                if (params.iso.subregion) {
                    url += `/${params.iso.subregion}`;
                }
            }

            return url;
        }

        if (params.use && params.useid) {
            return `/use/${params.use}/${params.useid}`;
        }

        if (params.wdpaid) {
            return `/wdpa/${params.wdpaid}`;
        }

        return '/';
    }

    static async execute(subscription: ISubscription, layerSlug: string, begin: Date, end: Date, forSubscription: boolean = false): Promise<BaseAlert[]> {

        logger.info('Executing analysis for', layerSlug, begin, end);

        const period: string = `${formatDate(begin)},${formatDate(end)}`;
        const query: Record<string, any> = { period };

        if (subscription.params.geostore) {
            query.geostore = subscription.params.geostore;
        }
        if (forSubscription) {
            query.forSubscription = true;
        }

        const path: string = AnalysisService.#pathFor(subscription);
        const url: string = `/v1/${layerSlug}${path}`;
        logger.debug('subscription id: ', subscription._id, 'Url ', url, 'and query ', query);
        switch (layerSlug) {

            case 'glad-all':
                return await GladAllService.getAlertsForSubscription(formatDate(begin), formatDate(end), subscription.params);
            case 'glad-alerts':
            case 'glad-l':
                return await GladLService.getAlertsForSubscription(formatDate(begin), formatDate(end), subscription.params);
            case 'glad-s2':
                return await GladS2Service.getAlertsForSubscription(formatDate(begin), formatDate(end), subscription.params);
            case 'glad-radd':
                return await GladRaddService.getAlertsForSubscription(formatDate(begin), formatDate(end), subscription.params);
            case 'viirs-active-fires':
                return await ViirsAlertsService.getAnalysisInPeriodForSubscription(formatDate(begin), formatDate(end), subscription.params);
            case 'monthly-summary': {
                const gladAlerts: GladAlert[] = await GLADAlertsService.getAnalysisInPeriodForSubscription(formatDate(begin), formatDate(end), subscription.params);
                const viirsAlerts: ViirsActiveFiresAlert[] = await ViirsAlertsService.getAnalysisInPeriodForSubscription(formatDate(begin), formatDate(end), subscription.params);
                const flattenedResults: MonthlySummaryAlert[] = []
                gladAlerts.forEach((alert: GladAlert) => flattenedResults.push({ ...alert, type: 'GLAD' }));
                viirsAlerts.forEach((alert: ViirsActiveFiresAlert) => flattenedResults.push({
                    ...alert,
                    type: 'VIIRS'
                }));
                return flattenedResults;
            }
            default: {
                const result: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
                    uri: url,
                    method: 'GET',
                    params: query
                });

                return await new Deserializer({ keyForAttribute: 'camelCase' }).deserialize(result);
            }

        }
    }
}

export default AnalysisService;
