import logger from 'logger';
import moment, { Moment } from 'moment';
import EmailHelpersService from 'services/emailHelpersService';
import AlertUrlService from 'services/alertUrlService';
import UrlService from 'services/urlService';
import { AlertResultWithCount, PresenterInterface } from 'presenters/presenter.interface';
import { ISubscription } from 'models/subscription';
import { ILayer } from 'models/layer';
import AreaService from 'services/areaService';
import GeostoreService from 'services/geostoreService';
import config from 'config';
import axios, { AxiosResponse } from 'axios';
import { GladAllAlertResultType } from 'types/alertResult.type';
import { GladAllPresenterResponse } from 'types/presenterResponse.type';

const DATASET_GLAD_ALL_ADM_0: string = '/dataset/gadm__integrated_alerts__iso_daily_alerts/latest/query';
const DATASET_GLAD_ALL_ADM_1: string = '/dataset/gadm__integrated_alerts__adm1_daily_alerts/latest/query';
const DATASET_GLAD_ALL_ADM_2: string = '/dataset/gadm__integrated_alerts__adm2_daily_alerts/latest/query';
const DATASET_GLAD_ALL_WDPA: string = '/dataset/wdpa_protected_areas__integrated_alerts__daily_alerts/latest/query';
const DATASET_GLAD_ALL_GEOSTORE: string = '/dataset/geostore__integrated_alerts__daily_alerts/latest/query';
const DATASET_GLAD_ALL_DOWNLOAD: string = '/dataset/gfw_integrated_alerts/latest/download';


class GLADAllPresenter extends PresenterInterface<GladAllAlertResultType, GladAllPresenterResponse> {

    static #getURLForAdmin0(startDate: string, endDate: string, country: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE iso = '${country}'
                               AND gfw_integrated_alerts__date >= '${startDate}'
                               AND gfw_integrated_alerts__date <= '${endDate}'
                               AND is__tree_cover_2022 = true`;
        return `${DATASET_GLAD_ALL_ADM_0}?sql=${sql}`;
    }

    static #getURLForAdmin1(startDate: string, endDate: string, country: string, region: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE iso = '${country}'
                               AND adm1 = '${region}'
                               AND gfw_integrated_alerts__date >= '${startDate}'
                               AND gfw_integrated_alerts__date <= '${endDate}'
                               AND is__tree_cover_2022 = true`;
        return `${DATASET_GLAD_ALL_ADM_1}?sql=${sql}`;
    }

    static #getURLForAdmin2(startDate: string, endDate: string, country: string, region: string, subregion: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE iso = '${country}'
                               AND adm1 = '${region}'
                               AND adm2 = '${subregion}'
                               AND gfw_integrated_alerts__date >= '${startDate}' `
            + `AND gfw_integrated_alerts__date <= '${endDate}' `
            + `AND is__tree_cover_2022 = true`;
        return `${DATASET_GLAD_ALL_ADM_2}?sql=${sql}`;
    }

    static #getURLForWDPA(startDate: string, endDate: string, wdpa: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE wdpa_protected_area__id = '${wdpa}'
                               AND gfw_integrated_alerts__date >= '${startDate}' `
            + `AND gfw_integrated_alerts__date <= '${endDate}' `
            + `AND is__tree_cover_2022 = true`;
        return `${DATASET_GLAD_ALL_WDPA}?sql=${sql}`;
    }

    static #getURLForGeostore(startDate: string, endDate: string, geostoreId: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE geostore__id = '${geostoreId}'
                               AND gfw_integrated_alerts__date >= '${startDate}'
                               AND gfw_integrated_alerts__date <= '${endDate}'
                               AND is__tree_cover_2022 = true`;
        return `${DATASET_GLAD_ALL_GEOSTORE}?sql=${sql}`;
    }

    static #getURLForDownload(startDate: string, endDate: string, geostoreId: string, geostoreSource: 'rw' | 'gfw' = 'rw'): string {
        const sql: string = GLADAllPresenter.#buildDownloadSQL(startDate, endDate);
        return `${DATASET_GLAD_ALL_DOWNLOAD}/{format}?sql=${sql}&geostore_origin=${geostoreSource}&geostore_id=${geostoreId}`;
    }

    static #getAdminURLForDownload(startDate: string, endDate: string, params: Record<string, any>):string {
        const parseSimplifyGeom = (iso: string, id1: string, id2: string): number => {
            const bigCountries: string[] = ['USA', 'RUS', 'CAN', 'CHN', 'BRA', 'IDN'];
            const baseThresh: 0.1|0.005 = bigCountries.includes(iso) ? 0.1 : 0.005;
            if (iso && !id1 && !id2) {
                return baseThresh;
            }
            return id1 && !id2 ? baseThresh / 10 : baseThresh / 100;
        };

        const { country, region, subregion, source: { provider, version } } = params.iso;
        const simplify: number = parseSimplifyGeom(country, region, subregion);
        const sql: string = GLADAllPresenter.#buildDownloadSQL(startDate, endDate);
        return `${DATASET_GLAD_ALL_DOWNLOAD}_by_aoi/{format}?sql=${sql}` +
            '&aoi[type]=admin' +
            `&aoi[country]=${country}` +
            (region ? `&aoi[region]=${region}` : '') +
            (subregion ? `&aoi[subregion]=${subregion}` : '') +
            (provider ? `&aoi[provider]=${provider}`: '') +
            (version ? `&aoi[version]=${version}` : '') +
            (simplify ? `&aoi[simplify]=${simplify}` : '');
    }

    static #buildDownloadSQL(startDate: string, endDate: string): string {
        return `SELECT latitude, longitude, gfw_integrated_alerts__date, umd_glad_landsat_alerts__confidence, umd_glad_sentinel2_alerts__confidence, `
            + `wur_radd_alerts__confidence, gfw_integrated_alerts__confidence FROM data WHERE gfw_integrated_alerts__date >= '${startDate}' `
            + `AND gfw_integrated_alerts__date <= '${endDate}' AND is__tree_cover_2022 = true`;
    }

    static async getURLForSubscription(startDate: string, endDate: string, params: Record<string, any>): Promise<string> {
        let areaIso: Record<string, any> = {};
        if (params?.area && params?.iso && params.iso?.country) {
           const area: Record<string, any> = await AreaService.getUserArea(params.area);
           areaIso = AreaService.getIsoParams(area);
        }

        const iso: Record<string, any> = Object.keys(areaIso).length && areaIso?.country ? areaIso : params.iso;
        
        const country: string = iso?.country;
        const region: string = iso?.region;
        const subregion: string = iso?.subregion;

        if (!!params && !!params.iso && !!params.iso.country && !!params.iso.region && !!params.iso.subregion) {
            return GLADAllPresenter.#getURLForAdmin2(startDate, endDate, country, region, subregion);
        }

        if (!!params && !!params.iso && !!params.iso.country && !!params.iso.region) {
            return GLADAllPresenter.#getURLForAdmin1(startDate, endDate, country, region);
        }

        if (!!params && !!params.iso && !!params.iso.country) {
            return GLADAllPresenter.#getURLForAdmin0(startDate, endDate, country);
        }

        if (!!params && !!params.wdpaid) {
            return GLADAllPresenter.#getURLForWDPA(startDate, endDate, params.wdpaid);
        }

        const geostoreId: string = await GeostoreService.getGeostoreIdFromSubscriptionParams(params);
        return GLADAllPresenter.#getURLForGeostore(startDate, endDate, geostoreId);
    }

    async getAlertsForSubscription(startDate: string, endDate: string, params: Record<string, any>): Promise<GladAllAlertResultType[]> {
        logger.debug('[GLAD-ALL] Entering analysis with params', startDate, endDate, params);
        const url: string = await GLADAllPresenter.getURLForSubscription(startDate, endDate, params);
        logger.info(`[GLAD-ALL] Preparing Data API request`);
        logger.debug(`[GLAD-ALL] Preparing Data API request, with URL ${config.get('dataApi.url')}${url}`);
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
        let areaIso: Record<string, any> = {};
        let area: Record<string, any>;

        if (params?.area && params?.iso && params.iso?.country) {
            area = await AreaService.getUserArea(params.area);
           areaIso = AreaService.getIsoParams(area);
        }

        const iso: Record<string, any> = Object.keys(areaIso).length && areaIso?.country ? areaIso : params.iso;
        const updatedParams: Record<string, any> = {...params, iso};

        let uri: string;
        if (AreaService.areaIsAdminBoundary(area, { provider: 'gadm', version: '4.1' })) {
            uri = this.buildAdminURL(updatedParams, startDate, endDate);
        } else {
            uri = await this.buildGeostoreURL(area, updatedParams, startDate, endDate);
        }

        return {
            csv: `${config.get('dataApi.url')}${uri}`.replace('{format}', 'csv'),
            json: `${config.get('dataApi.url')}${uri}`.replace('{format}', 'json'),
        };
    }

    private async buildGeostoreURL(area: Record<string, any>, updatedParams: Record<string, any>, startDate: string, endDate: string): Promise<string> {
        const geostoreSource: 'gfw' | 'rw' = area ? AreaService.getGeostoreSource(area) : 'rw';
        const geostoreId: string = await GeostoreService.getGeostoreIdFromSubscriptionParams(updatedParams);
        return GLADAllPresenter.#getURLForDownload(startDate, endDate, geostoreId, geostoreSource);
    }

    private buildAdminURL(params: Record<string, any>, startDate: string, endDate: string):string {
        return GLADAllPresenter.#getAdminURLForDownload(startDate, endDate, params);
    };

    buildResultObject(results: AlertResultWithCount<GladAllAlertResultType>, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): GladAllPresenterResponse {
        const resultObject: Partial<GladAllPresenterResponse> = { value: results.value };
        EmailHelpersService.updateMonthTranslations();
        moment.locale(subscription.language || 'en');

        const startDate: Moment = moment(begin);
        const endDate: Moment = moment(end);

        resultObject.month = startDate.format('MMMM');
        resultObject.year = startDate.format('YYYY');
        resultObject.week_of = `${startDate.format('DD MMM')}`;
        resultObject.week_start = startDate.format('DD/MM/YYYY');
        resultObject.week_end = endDate.format('DD/MM/YYYY');
        const alertCount: number = results.data.reduce((acc: number, curr: GladAllAlertResultType) => acc + curr.alert__count, 0);
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

        const sumArea: number = results.data.reduce((acc: number, curr: GladAllAlertResultType) => acc + curr.alert_area__ha, 0);
        resultObject.area_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(sumArea, 2));

        const intactForestAlerts: GladAllAlertResultType[] = results.data.filter((al: GladAllAlertResultType) => !!al.is__ifl_intact_forest_landscape_2016);
        const intactForestSumArea: number = intactForestAlerts.reduce((acc: number, curr: GladAllAlertResultType) => acc + curr.alert_area__ha, 0);
        resultObject.intact_forest_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(intactForestSumArea, 2));

        const primaryForestAlerts: GladAllAlertResultType[] = results.data.filter((al: GladAllAlertResultType) => !!al.is__umd_regional_primary_forest_2001);
        const primaryForestSumArea: number = primaryForestAlerts.reduce((acc: number, curr: GladAllAlertResultType) => acc + curr.alert_area__ha, 0);
        resultObject.primary_forest_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(primaryForestSumArea, 2));

        const peatLandAlerts: GladAllAlertResultType[] = results.data.filter((al: GladAllAlertResultType) => !!al.is__peatland);
        const peatLandSumArea: number = peatLandAlerts.reduce((acc: number, curr: GladAllAlertResultType) => acc + curr.alert_area__ha, 0);
        resultObject.peat_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(peatLandSumArea, 2));

        const wdpaAlerts: GladAllAlertResultType[] = results.data.filter((al: GladAllAlertResultType) => !!al.wdpa_protected_area__iucn_cat);
        const wdpaSumArea: number = wdpaAlerts.reduce((acc: number, curr: GladAllAlertResultType) => acc + curr.alert_area__ha, 0);
        resultObject.wdpa_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(wdpaSumArea, 2));

        return resultObject as GladAllPresenterResponse;
    }

    async transform(results: AlertResultWithCount<GladAllAlertResultType>, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): Promise<GladAllPresenterResponse> {
        try {
            const resultObject: GladAllPresenterResponse = this.buildResultObject(results, subscription, layer, begin, end);

            resultObject.downloadUrls = await this.getDownloadURLs(
                moment(begin).format('YYYY-MM-DD'),
                moment(end).format('YYYY-MM-DD'),
                subscription.params
            );

            resultObject.glad_alert_type = EmailHelpersService.translateAlertType('glad-all', subscription.language);

            logger.info('GLAD-ALL Results ', resultObject);
            return resultObject;
        } catch (err) {
            logger.error(err);
            throw err;
        }

    }
}

export default new GLADAllPresenter();
