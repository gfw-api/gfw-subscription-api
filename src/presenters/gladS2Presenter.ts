import logger from 'logger';
import moment from 'moment';
import config from 'config';
import axios, { AxiosResponse } from 'axios';
import EmailHelpersService from 'services/emailHelpersService';
import GladAllPresenter from 'presenters/gladAllPresenter';
import { AlertResultWithCount, PresenterInterface } from 'presenters/presenter.interface';
import { ISubscription } from 'models/subscription';
import { ILayer } from 'models/layer';
import { GladS2AlertResultType } from 'types/alertResult.type';
import GeostoreService from 'services/geostoreService';
import { GladS2PresenterResponse } from 'types/presenterResponse.type';
import AreaService from 'services/areaService';

const DATASET_GLAD_S2_ADM_0: string = '/dataset/gadm__integrated_alerts__iso_daily_alerts/latest/query';
const DATASET_GLAD_S2_ADM_1: string = '/dataset/gadm__integrated_alerts__adm1_daily_alerts/latest/query';
const DATASET_GLAD_S2_ADM_2: string = '/dataset/gadm__integrated_alerts__adm2_daily_alerts/latest/query';
const DATASET_GLAD_S2_WDPA: string = '/dataset/wdpa_protected_areas__integrated_alerts__daily_alerts/latest/query';
const DATASET_GLAD_S2_GEOSTORE: string = '/dataset/geostore__integrated_alerts__daily_alerts/latest/query';
const DATASET_GLAD_S2_DOWNLOAD: string = '/dataset/gfw_integrated_alerts/latest/download';

class GLADS2Presenter extends PresenterInterface<GladS2AlertResultType, GladS2PresenterResponse> {

    static #getURLForAdmin0(startDate: string, endDate: string, country: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE iso = '${country}'
                               AND umd_glad_sentinel2_alerts__date >= '${startDate}'
                               AND umd_glad_sentinel2_alerts__date <= '${endDate}'`;
        return `${DATASET_GLAD_S2_ADM_0}?sql=${sql}`;
    }

    static #getURLForAdmin1(startDate: string, endDate: string, country: string, region: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE iso = '${country}'
                               AND adm1 = '${region}'
                               AND umd_glad_sentinel2_alerts__date >= '${startDate}' `
            + `AND umd_glad_sentinel2_alerts__date <= '${endDate}'`;
        return `${DATASET_GLAD_S2_ADM_1}?sql=${sql}`;
    }

    static #getURLForAdmin2(startDate: string, endDate: string, country: string, region: string, subregion: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE iso = '${country}'
                               AND adm1 = '${region}'
                               AND adm2 = '${subregion}'
                               AND umd_glad_sentinel2_alerts__date >= '${startDate}' `
            + `AND umd_glad_sentinel2_alerts__date <= '${endDate}'`;
        return `${DATASET_GLAD_S2_ADM_2}?sql=${sql}`;
    }

    static #getURLForWDPA(startDate: string, endDate: string, wdpa: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE wdpa_protected_area__id = '${wdpa}'
                               AND umd_glad_sentinel2_alerts__date >= '${startDate}' `
            + `AND umd_glad_sentinel2_alerts__date <= '${endDate}'`;
        return `${DATASET_GLAD_S2_WDPA}?sql=${sql}`;
    }

    static #getURLForGeostore(startDate: string, endDate: string, geostoreId: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE geostore__id = '${geostoreId}'
                               AND umd_glad_sentinel2_alerts__date >= '${startDate}' `
            + `AND umd_glad_sentinel2_alerts__date <= '${endDate}'`;
        return `${DATASET_GLAD_S2_GEOSTORE}?sql=${sql}`;
    }

    static #getURLForDownload(startDate: string, endDate: string, geostoreId: string, geostoreSource: 'gfw' | 'rw' = 'rw'): string {
        const sql: string = GLADS2Presenter.#buildDownloadSQL(startDate, endDate);
        return `${DATASET_GLAD_S2_DOWNLOAD}/{format}?sql=${sql}&geostore_origin=${geostoreSource}&geostore_id=${geostoreId}`;
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
        const sql: string = GLADS2Presenter.#buildDownloadSQL(startDate, endDate);
        return `${DATASET_GLAD_S2_DOWNLOAD}_by_aoi/{format}?sql=${sql}` +
            '&aoi[type]=admin' +
            `&aoi[country]=${country}` +
            (region ? `&aoi[region]=${region}` : '') +
            (subregion ? `&aoi[subregion]=${subregion}` : '') +
            (provider ? `&aoi[provider]=${provider}`: '') +
            (version ? `&aoi[version]=${version}` : '') +
            (simplify ? `&aoi[simplify]=${simplify}` : '');
    }

    static #buildDownloadSQL(startDate: string, endDate: string): string {
        return `SELECT latitude, longitude, umd_glad_sentinel2_alerts__date, umd_glad_sentinel2_alerts__confidence `
            + `FROM data WHERE umd_glad_sentinel2_alerts__date >= ${startDate} AND umd_glad_sentinel2_alerts__date <= ${endDate}`;
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
            return GLADS2Presenter.#getURLForAdmin2(startDate, endDate, country, region, subregion);
        }

        if (!!params && !!params.iso && !!params.iso.country && !!params.iso.region) {
            return GLADS2Presenter.#getURLForAdmin1(startDate, endDate, country, region);
        }

        if (!!params && !!params.iso && !!params.iso.country) {
            return GLADS2Presenter.#getURLForAdmin0(startDate, endDate, country);
        }

        if (!!params && !!params.wdpaid) {
            return GLADS2Presenter.#getURLForWDPA(startDate, endDate, params.wdpaid);
        }

        const geostoreId: string = await GeostoreService.getGeostoreIdFromSubscriptionParams(params);
        return GLADS2Presenter.#getURLForGeostore(startDate, endDate, geostoreId);
    }

    async getAlertsForSubscription(startDate: string, endDate: string, params: Record<string, any>): Promise<GladS2AlertResultType[]> {
        logger.debug('[GLAD-S2] Entering analysis with params', startDate, endDate, params);
        const url: string = await GLADS2Presenter.getURLForSubscription(startDate, endDate, params);
        logger.debug(`[GLAD-S2] Preparing Data API request`);
        logger.debug(`[GLAD-S2] Preparing Data API request, with URL ${config.get('dataApi.url')}${url}`);
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
        return GLADS2Presenter.#getURLForDownload(startDate, endDate, geostoreId, geostoreSource);
    }

    private buildAdminURL(params: Record<string, any>, startDate: string, endDate: string):string {
        return GLADS2Presenter.#getAdminURLForDownload(startDate, endDate, params);
    }

    async transform(results: AlertResultWithCount<GladS2AlertResultType>, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): Promise<GladS2PresenterResponse> {
        try {
            const resultObject: GladS2PresenterResponse = GladAllPresenter.buildResultObject(results, subscription, layer, begin, end);

            resultObject.downloadUrls = await this.getDownloadURLs(
                moment(begin).format('YYYY-MM-DD'),
                moment(end).format('YYYY-MM-DD'),
                subscription.params
            );

            resultObject.glad_alert_type = EmailHelpersService.translateAlertType('glad-s2', subscription.language);

            logger.info('GLAD-S2 Results ', resultObject);
            return resultObject;
        } catch (err) {
            logger.error(err);
            throw err;
        }

    }

}

export default new GLADS2Presenter();
