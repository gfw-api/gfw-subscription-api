import axios, { AxiosResponse } from 'axios';
import config from 'config';
import logger from 'logger';
import moment, { Moment } from 'moment';

import GeostoreService from 'services/geostoreService';
import { GladLAlert } from 'types/analysis.type';

const DATASET_GLAD_L_ADM_0: string = '/dataset/gadm__glad__adm2_daily_alerts/latest/query';
const DATASET_GLAD_L_ADM_1: string = '/dataset/gadm__glad__adm2_daily_alerts/latest/query';
const DATASET_GLAD_L_ADM_2: string = '/dataset/gadm__glad__adm2_daily_alerts/latest/query';
const DATASET_GLAD_L_WDPA: string = '/dataset/wdpa_protected_areas__glad__daily_alerts/latest/query';
const DATASET_GLAD_L_GEOSTORE: string = '/dataset/geostore__glad__daily_alerts/latest/query';
const DATASET_GLAD_L_DOWNLOAD: string = '/dataset/umd_glad_landsat_alerts/latest/download';

class GladLService {

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
                               AND alert__date >= '${endDate}'
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
                               AND alert__date >= '${startDate}'
                               AND alert__date <= '${endDate}'`;
        return `${DATASET_GLAD_L_GEOSTORE}?sql=${sql}`;
    }

    static #getURLForDownload(startDate: string, endDate: string, geostoreId: string): string {
        const sql: string = `SELECT latitude, longitude, umd_glad_landsat_alerts__date, umd_glad_landsat_alerts__confidence `
            + `FROM data WHERE umd_glad_landsat_alerts__date >= '${startDate}' AND umd_glad_landsat_alerts__date <= '${endDate}'`;
        return `${DATASET_GLAD_L_DOWNLOAD}/{format}?sql=${sql}&geostore_origin=rw&geostore_id=${geostoreId}`;
    }

    static async getURLForSubscription(startDate: string, endDate: string, params: Record<string, any>): Promise<string> {
        if (!!params && !!params.iso && !!params.iso.country && !!params.iso.region && !!params.iso.subregion) {
            return GladLService.#getURLForAdmin2(startDate, endDate, params.iso.country, params.iso.region, params.iso.subregion);
        }

        if (!!params && !!params.iso && !!params.iso.country && !!params.iso.region) {
            return GladLService.#getURLForAdmin1(startDate, endDate, params.iso.country, params.iso.region);
        }

        if (!!params && !!params.iso && !!params.iso.country) {
            return GladLService.#getURLForAdmin0(startDate, endDate, params.iso.country);
        }

        if (!!params && !!params.wdpaid) {
            return GladLService.#getURLForWDPA(startDate, endDate, params.wdpaid);
        }

        const geostoreId: string = await GeostoreService.getGeostoreIdFromSubscriptionParams(params);
        return GladLService.#getURLForGeostore(startDate, endDate, geostoreId);
    }

    static async getAlertsForSubscription(startDate: string, endDate: string, params: Record<string, any>): Promise<GladLAlert[]> {
        logger.info('[GLAD-L] Entering analysis with params', startDate, endDate, params);
        const url: string = await GladLService.getURLForSubscription(startDate, endDate, params);
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

    static async getAlertsSamePeriodLastYearForSubscription(startDate: string, endDate: string, params: Record<string, any>): Promise<GladLAlert[]> {
        const lastYearStartDate: Moment = moment(startDate).subtract('1', 'y');
        const lastYearEndDate: Moment = moment(endDate).subtract('1', 'y');
        return GladLService.getAlertsForSubscription(
            lastYearStartDate.format('YYYY-MM-DD'),
            lastYearEndDate.format('YYYY-MM-DD'),
            params
        );
    }

    static async getDownloadURLs(startDate: string, endDate: string, params: Record<string, any>): Promise<{ csv: string, json: string }> {
        const geostoreId: string = await GeostoreService.getGeostoreIdFromSubscriptionParams(params);
        const uri: string = GladLService.#getURLForDownload(startDate, endDate, geostoreId);
        return {
            csv: `${config.get('dataApi.url')}${uri}`.replace('{format}', 'csv'),
            json: `${config.get('dataApi.url')}${uri}`.replace('{format}', 'json'),
        };
    }

}

export default GladLService;
