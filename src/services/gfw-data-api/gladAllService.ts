import axios, { AxiosResponse } from 'axios';
import config from 'config';
import logger from 'logger';
import moment, { Moment } from 'moment';
import GeostoreService from 'services/geostoreService';
import { GladAllAlert } from 'types/analysis.type';

const DATASET_GLAD_ALL_ADM_0: string = '/dataset/gadm__integrated_alerts__iso_daily_alerts/latest/query';
const DATASET_GLAD_ALL_ADM_1: string = '/dataset/gadm__integrated_alerts__adm1_daily_alerts/latest/query';
const DATASET_GLAD_ALL_ADM_2: string = '/dataset/gadm__integrated_alerts__adm2_daily_alerts/latest/query';
const DATASET_GLAD_ALL_WDPA: string = '/dataset/wdpa_protected_areas__integrated_alerts__daily_alerts/latest/query';
const DATASET_GLAD_ALL_GEOSTORE: string = '/dataset/geostore__integrated_alerts__daily_alerts/latest/query';
const DATASET_GLAD_ALL_DOWNLOAD: string = '/dataset/gfw_integrated_alerts/latest/download';

class GladAllService {

    static #getURLForAdmin0(startDate: string, endDate: string, country: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE iso = '${country}'
                               AND gfw_integrated_alerts__date >= '${startDate}'
                               AND gfw_integrated_alerts__date <= '${endDate}'`;
        return `${DATASET_GLAD_ALL_ADM_0}?sql=${sql}`;
    }

    static #getURLForAdmin1(startDate: string, endDate: string, country: string, region: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE iso = '${country}'
                               AND adm1 = '${region}'
                               AND gfw_integrated_alerts__date >= '${startDate}'
                               AND gfw_integrated_alerts__date <= '${endDate}'`;
        return `${DATASET_GLAD_ALL_ADM_1}?sql=${sql}`;
    }

    static #getURLForAdmin2(startDate: string, endDate: string, country: string, region: string, subregion: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE iso = '${country}'
                               AND adm1 = '${region}'
                               AND adm2 = '${subregion}'
                               AND gfw_integrated_alerts__date >= '${startDate}' `
            + `AND gfw_integrated_alerts__date <= '${endDate}'`;
        return `${DATASET_GLAD_ALL_ADM_2}?sql=${sql}`;
    }

    static #getURLForWDPA(startDate: string, endDate: string, wdpa: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE wdpa_protected_area__id = '${wdpa}'
                               AND gfw_integrated_alerts__date >= '${startDate}' `
            + `AND gfw_integrated_alerts__date <= '${endDate}'`;
        return `${DATASET_GLAD_ALL_WDPA}?sql=${sql}`;
    }

    static #getURLForGeostore(startDate: string, endDate: string, geostoreId: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE geostore__id = '${geostoreId}'
                               AND gfw_integrated_alerts__date >= '${startDate}'
                               AND gfw_integrated_alerts__date <= '${endDate}'`;
        return `${DATASET_GLAD_ALL_GEOSTORE}?sql=${sql}`;
    }

    static #getURLForDownload(startDate: string, endDate: string, geostoreId: string): string {
        const sql: string = `SELECT latitude, longitude, gfw_integrated_alerts__date, umd_glad_landsat_alerts__confidence, umd_glad_sentinel2_alerts__confidence, `
            + `wur_radd_alerts__confidence, gfw_integrated_alerts__confidence FROM data WHERE gfw_integrated_alerts__date >= '${startDate}' `
            + `AND gfw_integrated_alerts__date <= '${endDate}'`;
        return `${DATASET_GLAD_ALL_DOWNLOAD}/{format}?sql=${sql}&geostore_origin=rw&geostore_id=${geostoreId}`;
    }

    static async getURLForSubscription(startDate: string, endDate: string, params: Record<string, any>): Promise<string> {
        if (!!params && !!params.iso && !!params.iso.country && !!params.iso.region && !!params.iso.subregion) {
            return GladAllService.#getURLForAdmin2(startDate, endDate, params.iso.country, params.iso.region, params.iso.subregion);
        }

        if (!!params && !!params.iso && !!params.iso.country && !!params.iso.region) {
            return GladAllService.#getURLForAdmin1(startDate, endDate, params.iso.country, params.iso.region);
        }

        if (!!params && !!params.iso && !!params.iso.country) {
            return GladAllService.#getURLForAdmin0(startDate, endDate, params.iso.country);
        }

        if (!!params && !!params.wdpaid) {
            return GladAllService.#getURLForWDPA(startDate, endDate, params.wdpaid);
        }

        const geostoreId: string = await GeostoreService.getGeostoreIdFromSubscriptionParams(params);
        return GladAllService.#getURLForGeostore(startDate, endDate, geostoreId);
    }

    static async getAlertsForSubscription(startDate: string, endDate: string, params: Record<string, any>): Promise<GladAllAlert[]> {
        logger.info('[GLAD-ALL] Entering analysis with params', startDate, endDate, params);
        const url: string = await GladAllService.getURLForSubscription(startDate, endDate, params);
        logger.info(`[GLAD-ALL] Preparing Data API request, with URL ${config.get('dataApi.url')}${url}`);
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

    static async getAlertsSamePeriodLastYearForSubscription(startDate: string, endDate: string, params: Record<string, any>): Promise<GladAllAlert[]> {
        const lastYearStartDate: Moment = moment(startDate).subtract('1', 'y');
        const lastYearEndDate: Moment = moment(endDate).subtract('1', 'y');
        return GladAllService.getAlertsForSubscription(
            lastYearStartDate.format('YYYY-MM-DD'),
            lastYearEndDate.format('YYYY-MM-DD'),
            params
        );
    }

    static async getDownloadURLs(startDate: string, endDate: string, params: Record<string, any>): Promise<{ csv: string, json: string }> {
        const geostoreId: string = await GeostoreService.getGeostoreIdFromSubscriptionParams(params);
        const uri: string = GladAllService.#getURLForDownload(startDate, endDate, geostoreId);
        return {
            csv: `${config.get('dataApi.url')}${uri}`.replace('{format}', 'csv'),
            json: `${config.get('dataApi.url')}${uri}`.replace('{format}', 'json'),
        };
    }

}

export default GladAllService;
