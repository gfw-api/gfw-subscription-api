import logger from 'logger';
import moment, { Moment } from 'moment';
import EmailHelpersService from 'services/emailHelpersService';
import { AlertResultWithCount, PresenterInterface } from 'presenters/presenter.interface';
import { ISubscription } from 'models/subscription';
import { ILayer } from 'models/layer';
import { GladLAlertResultType } from 'types/alertResult.type';
import GeostoreService from 'services/geostoreService';
import config from 'config';
import axios, { AxiosResponse } from 'axios';
import { GladLPresenterResponse } from 'types/presenterResponse.type';
import AlertUrlService from 'services/alertUrlService';
import UrlService from 'services/urlService';

const DATASET_GLAD_L_ADM_0: string = '/dataset/gadm__glad__iso_daily_alerts/latest/query';
const DATASET_GLAD_L_ADM_1: string = '/dataset/gadm__glad__adm1_daily_alerts/latest/query';
const DATASET_GLAD_L_ADM_2: string = '/dataset/gadm__glad__adm2_daily_alerts/latest/query';
const DATASET_GLAD_L_WDPA: string = '/dataset/wdpa_protected_areas__glad__daily_alerts/latest/query';
const DATASET_GLAD_L_GEOSTORE: string = '/dataset/geostore__glad__daily_alerts/latest/query';
const DATASET_GLAD_L_DOWNLOAD: string = '/dataset/umd_glad_landsat_alerts/latest/download';


class GLADLPresenter extends PresenterInterface<GladLAlertResultType, GladLPresenterResponse> {

    static #getURLForAdmin0(startDate: string, endDate: string, country: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE iso = '${country}'
                               AND alert__date >= '${startDate}'
                               AND alert__date <= '${endDate}'`;
        return `${DATASET_GLAD_L_ADM_0}?sql=${sql}`;
    }

    static #getURLForAdmin1(startDate: string, endDate: string, country: string, region: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE iso = '${country}'
                               AND adm1 = '${region}'
                               AND alert__date >= '${startDate}'
                               AND alert__date <= '${endDate}'`;
        return `${DATASET_GLAD_L_ADM_1}?sql=${sql}`;
    }

    static #getURLForAdmin2(startDate: string, endDate: string, country: string, region: string, subregion: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE iso = '${country}'
                               AND adm1 = '${region}'
                               AND adm2 = '${subregion}'
                               AND alert__date >= '${startDate}' `
            + `AND alert__date <= '${endDate}'`;
        return `${DATASET_GLAD_L_ADM_2}?sql=${sql}`;
    }

    static #getURLForWDPA(startDate: string, endDate: string, wdpa: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE wdpa_protected_area__id = '${wdpa}'
                               AND alert__date >= '${startDate}'
                               AND alert__date <= '${endDate}'`;
        return `${DATASET_GLAD_L_WDPA}?sql=${sql}`;
    }

    static #getURLForGeostore(startDate: string, endDate: string, geostoreId: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE geostore__id = '${geostoreId}'
                               AND umd_glad_landsat_alerts__date >= '${startDate}'
                               AND umd_glad_landsat_alerts__date <= '${endDate}'`;
        return `${DATASET_GLAD_L_GEOSTORE}?sql=${sql}`;
    }

    static #getURLForDownload(startDate: string, endDate: string, geostoreId: string): string {
        const sql: string = `SELECT latitude, longitude, umd_glad_landsat_alerts__date, umd_glad_landsat_alerts__confidence `
            + `FROM data WHERE umd_glad_landsat_alerts__date >= '${startDate}' AND umd_glad_landsat_alerts__date <= '${endDate}'`;
        return `${DATASET_GLAD_L_DOWNLOAD}/{format}?sql=${sql}&geostore_origin=rw&geostore_id=${geostoreId}`;
    }

    async getURLForSubscription(startDate: string, endDate: string, params: Record<string, any>): Promise<string> {
        if (!!params && !!params.iso && !!params.iso.country && !!params.iso.region && !!params.iso.subregion) {
            return GLADLPresenter.#getURLForAdmin2(startDate, endDate, params.iso.country, params.iso.region, params.iso.subregion);
        }

        if (!!params && !!params.iso && !!params.iso.country && !!params.iso.region) {
            return GLADLPresenter.#getURLForAdmin1(startDate, endDate, params.iso.country, params.iso.region);
        }

        if (!!params && !!params.iso && !!params.iso.country) {
            return GLADLPresenter.#getURLForAdmin0(startDate, endDate, params.iso.country);
        }

        if (!!params && !!params.wdpaid) {
            return GLADLPresenter.#getURLForWDPA(startDate, endDate, params.wdpaid);
        }

        const geostoreId: string = await GeostoreService.getGeostoreIdFromSubscriptionParams(params);
        return GLADLPresenter.#getURLForGeostore(startDate, endDate, geostoreId);
    }

    async getAlertsSamePeriodLastYearForSubscription(startDate: Date, endDate: Date, params: Record<string, any>): Promise<GladLAlertResultType[]> {
        const lastYearStartDate: moment.Moment = moment(startDate).subtract('1', 'y');
        const lastYearEndDate: moment.Moment = moment(endDate).subtract('1', 'y');
        return this.getAlertsForSubscription(
            lastYearStartDate.format('YYYY-MM-DD'),
            lastYearEndDate.format('YYYY-MM-DD'),
            params
        );
    }

    async getAlertsForSubscription(startDate: string, endDate: string, params: Record<string, any>): Promise<GladLAlertResultType[]> {
        logger.info('[GLAD-L] Entering analysis with params', startDate, endDate, params);
        const url: string = await this.getURLForSubscription(startDate, endDate, params);
        logger.info(`[GLAD-L] Preparing Data API request, with URL ${config.get('dataApi.url')}${url}`);
        const response: AxiosResponse<Record<string, any>> = await axios.get(
            `${config.get('dataApi.url')}${url}`,
            {
                headers: {
                    'x-api-key': config.get('dataApi.apiKey'),
                    origin: config.get('dataApi.origin'),
                }
            }
        );
        return response.data.data;
    }

    async getDownloadURLs(startDate: string, endDate: string, params: Record<string, any>): Promise<{ csv: string, json: string }> {
        const geostoreId: string = await GeostoreService.getGeostoreIdFromSubscriptionParams(params);
        const uri: string = GLADLPresenter.#getURLForDownload(startDate, endDate, geostoreId);
        return {
            csv: `${config.get('dataApi.url')}${uri}`.replace('{format}', 'csv'),
            json: `${config.get('dataApi.url')}${uri}`.replace('{format}', 'json'),
        };
    }

    buildResultObject(results: AlertResultWithCount<GladLAlertResultType>, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): GladLPresenterResponse {
        const resultObject: Partial<GladLPresenterResponse> = { value: results.value };
        EmailHelpersService.updateMonthTranslations();
        moment.locale(subscription.language || 'en');

        const startDate: Moment = moment(begin);
        const endDate: Moment = moment(end);

        resultObject.month = startDate.format('MMMM');
        resultObject.year = startDate.format('YYYY');
        resultObject.week_of = `${startDate.format('DD MMM')}`;
        resultObject.week_start = startDate.format('DD/MM/YYYY');
        resultObject.week_end = endDate.format('DD/MM/YYYY');
        const alertCount: number = results.data.reduce((acc: number, curr: GladLAlertResultType) => acc + curr.alert__count, 0)
        resultObject.glad_count = alertCount;
        resultObject.alert_count = alertCount;

        resultObject.priority_areas = EmailHelpersService.calculateGLADPriorityAreaValues(results.data, resultObject.alert_count);
        resultObject.formatted_alert_count = EmailHelpersService.formatAlertCount(resultObject.alert_count);
        resultObject.formatted_priority_areas = EmailHelpersService.formatPriorityAreas(resultObject.priority_areas);

        resultObject.alert_link = AlertUrlService.generate(subscription, layer, begin, end);
        resultObject.dashboard_link = UrlService.dashboardUrl(subscription.id, subscription.language, 'glad');
        resultObject.map_url_intact_forest = AlertUrlService.generateIntactForestMapURL(subscription, layer, begin, end);
        resultObject.map_url_primary_forest = AlertUrlService.generatePrimaryForestMapURL(subscription, layer, begin, end);
        resultObject.map_url_peat = AlertUrlService.generatePeatMapURL(subscription, layer, begin, end);
        resultObject.map_url_wdpa = AlertUrlService.generateWDPAMapURL(subscription, layer, begin, end);

        const sumArea: number = results.data.reduce((acc: number, curr: GladLAlertResultType) => acc + curr.alert_area__ha, 0);
        resultObject.area_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(sumArea, 2));

        const intactForestAlerts: GladLAlertResultType[] = results.data.filter((al: GladLAlertResultType) => !!al.is__ifl_intact_forest_landscape_2016);
        const intactForestSumArea: number = intactForestAlerts.reduce((acc: number, curr: GladLAlertResultType) => acc + curr.alert_area__ha, 0);
        resultObject.intact_forest_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(intactForestSumArea, 2));

        const primaryForestAlerts: GladLAlertResultType[] = results.data.filter((al: GladLAlertResultType) => !!al.is__umd_regional_primary_forest_2001);
        const primaryForestSumArea: number = primaryForestAlerts.reduce((acc: number, curr: GladLAlertResultType) => acc + curr.alert_area__ha, 0);
        resultObject.primary_forest_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(primaryForestSumArea, 2));

        const peatLandAlerts: GladLAlertResultType[] = results.data.filter((al: GladLAlertResultType) => !!al.is__peatland);
        const peatLandSumArea: number = peatLandAlerts.reduce((acc: number, curr: GladLAlertResultType) => acc + curr.alert_area__ha, 0);
        resultObject.peat_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(peatLandSumArea, 2));

        const wdpaAlerts: GladLAlertResultType[] = results.data.filter((al: GladLAlertResultType) => !!al.wdpa_protected_area__iucn_cat);
        const wdpaSumArea: number = wdpaAlerts.reduce((acc: number, curr: GladLAlertResultType) => acc + curr.alert_area__ha, 0);
        resultObject.wdpa_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(wdpaSumArea, 2));

        return resultObject as GladLPresenterResponse;
    }

    async transform(results: AlertResultWithCount<GladLAlertResultType>, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): Promise<GladLPresenterResponse> {
        try {
            const resultObject: GladLPresenterResponse = this.buildResultObject(results, subscription, layer, begin, end);

            resultObject.downloadUrls = await this.getDownloadURLs(
                moment(begin).format('YYYY-MM-DD'),
                moment(end).format('YYYY-MM-DD'),
                subscription.params
            );

            resultObject.glad_alert_type = EmailHelpersService.translateAlertType('glad-l', subscription.language);

            logger.info('GLAD-L Results ', resultObject);
            return resultObject;
        } catch (err) {
            logger.error(err);
            throw err;
        }

    }

}

export default new GLADLPresenter();
