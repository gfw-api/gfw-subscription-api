import axios, { AxiosResponse } from 'axios';
import config from 'config';
import logger from 'logger';
import moment, { Moment } from 'moment';
import GeostoreService from 'services/geostoreService';
import { GladS2Alert } from 'types/analysis.type';

const DATASET_GLAD_S2_ADM_0: string = '/dataset/gadm__integrated_alerts__iso_daily_alerts/latest/query';
const DATASET_GLAD_S2_ADM_1: string = '/dataset/gadm__integrated_alerts__adm1_daily_alerts/latest/query';
const DATASET_GLAD_S2_ADM_2: string = '/dataset/gadm__integrated_alerts__adm2_daily_alerts/latest/query';
const DATASET_GLAD_S2_WDPA: string = '/dataset/wdpa_protected_areas__integrated_alerts__daily_alerts/latest/query';
const DATASET_GLAD_S2_GEOSTORE: string = '/dataset/geostore__integrated_alerts__daily_alerts/latest/query';
const DATASET_GLAD_S2_DOWNLOAD: string = '/dataset/gfw_integrated_alerts/latest/download';

class GladS2Service {

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

    static #getURLForDownload(startDate: string, endDate: string, geostoreId: string): string {
        const sql: string = `SELECT latitude, longitude, umd_glad_sentinel2_alerts__date, umd_glad_sentinel2_alerts__confidence `
            + `FROM data WHERE umd_glad_sentinel2_alerts__date >= ${startDate} AND umd_glad_sentinel2_alerts__date <= ${endDate}`;
        return `${DATASET_GLAD_S2_DOWNLOAD}/{format}?sql=${sql}&geostore_origin=rw&geostore_id=${geostoreId}`;
    }

    static async getURLForSubscription(startDate: string, endDate: string, params: Record<string, any>): Promise<string> {
        if (!!params && !!params.iso && !!params.iso.country && !!params.iso.region && !!params.iso.subregion) {
            return GladS2Service.#getURLForAdmin2(startDate, endDate, params.iso.country, params.iso.region, params.iso.subregion);
        }

        if (!!params && !!params.iso && !!params.iso.country && !!params.iso.region) {
            return GladS2Service.#getURLForAdmin1(startDate, endDate, params.iso.country, params.iso.region);
        }

        if (!!params && !!params.iso && !!params.iso.country) {
            return GladS2Service.#getURLForAdmin0(startDate, endDate, params.iso.country);
        }

        if (!!params && !!params.wdpaid) {
            return GladS2Service.#getURLForWDPA(startDate, endDate, params.wdpaid);
        }

        const geostoreId: string = await GeostoreService.getGeostoreIdFromSubscriptionParams(params);
        return GladS2Service.#getURLForGeostore(startDate, endDate, geostoreId);
    }

    static async getAlertsForSubscription(startDate: string, endDate: string, params: Record<string, any>): Promise<GladS2Alert[]> {
        logger.info('[GLAD-S2] Entering analysis with params', startDate, endDate, params);
        const url: string = await GladS2Service.getURLForSubscription(startDate, endDate, params);
        logger.info(`[GLAD-S2] Preparing Data API request, with URL ${config.get('dataApi.url')}${url}`);
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

    static async getAlertsSamePeriodLastYearForSubscription(startDate: string, endDate: string, params: Record<string, any>): Promise<GladS2Alert[]> {
        const lastYearStartDate: Moment = moment(startDate).subtract('1', 'y');
        const lastYearEndDate: Moment = moment(endDate).subtract('1', 'y');
        return GladS2Service.getAlertsForSubscription(
            lastYearStartDate.format('YYYY-MM-DD'),
            lastYearEndDate.format('YYYY-MM-DD'),
            params
        );
    }

    static async getDownloadURLs(startDate: string, endDate: string, params: Record<string, any>): Promise<{ csv: string, json: string }> {
        const geostoreId: string = await GeostoreService.getGeostoreIdFromSubscriptionParams(params);
        const uri: string = GladS2Service.#getURLForDownload(startDate, endDate, geostoreId);
        return {
            csv: `${config.get('dataApi.url')}${uri}`.replace('{format}', 'csv'),
            json: `${config.get('dataApi.url')}${uri}`.replace('{format}', 'json'),
        };
    }

}

export default GladS2Service;
