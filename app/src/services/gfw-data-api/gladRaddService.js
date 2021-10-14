const axios = require('axios');
const config = require('config');
const logger = require('logger');
const moment = require('moment');

const GeostoreService = require('services/geostoreService');

const DATASET_GLAD_RADD_ADM_0 = '/dataset/gadm__integrated_alerts__iso_daily_alerts/latest/query';
const DATASET_GLAD_RADD_ADM_1 = '/dataset/gadm__integrated_alerts__adm1_daily_alerts/latest/query';
const DATASET_GLAD_RADD_ADM_2 = '/dataset/gadm__integrated_alerts__adm2_daily_alerts/latest/query';
const DATASET_GLAD_RADD_WDPA = '/dataset/wdpa_protected_areas__integrated_alerts__daily_alerts/latest/query';
const DATASET_GLAD_RADD_GEOSTORE = '/dataset/geostore__integrated_alerts__daily_alerts/latest/query';
const DATASET_GLAD_RADD_DOWNLOAD = '/dataset/gfw_integrated_alerts/latest/download';

class GladRaddService {

    static getURLForAdmin0(startDate, endDate, country) {
        const sql = `SELECT wur_radd_alerts__confidence, SUM(alert__count) AS alert__count, SUM(alert_area__ha) AS alert_area__ha 
                     FROM data WHERE iso="${country}" AND wur_radd_alerts__date >= "${startDate}" AND wur_radd_alerts__date <= "${endDate}"`;
        return `${DATASET_GLAD_RADD_ADM_0}?sql=${sql}`;
    }

    static getURLForAdmin1(startDate, endDate, country, region) {
        const sql = `SELECT wur_radd_alerts__confidence, SUM(alert__count) AS alert__count, SUM(alert_area__ha) AS alert_area__ha 
                     FROM data WHERE iso="${country}" AND adm1="${region}" AND wur_radd_alerts__date >= "${startDate}" 
                     AND wur_radd_alerts__date <= "${endDate}"`;
        return `${DATASET_GLAD_RADD_ADM_1}?sql=${sql}`;
    }

    static getURLForAdmin2(startDate, endDate, country, region, subregion) {
        const sql = `SELECT wur_radd_alerts__confidence, SUM(alert__count) AS alert__count, SUM(alert_area__ha) AS alert_area__ha 
                     FROM data WHERE iso="${country}" AND adm1="${region}" AND adm2="${subregion}" AND wur_radd_alerts__date >= "${startDate}" 
                     AND wur_radd_alerts__date <= "${endDate}"`;
        return `${DATASET_GLAD_RADD_ADM_2}?sql=${sql}`;
    }

    static getURLForWDPA(startDate, endDate, wdpa) {
        const sql = `SELECT wur_radd_alerts__confidence, SUM(alert__count) AS alert__count, SUM(alert_area__ha) AS alert_area__ha 
                     FROM data WHERE wdpa_protected_area__id="${wdpa}" AND wur_radd_alerts__date >= "${startDate}" 
                     AND wur_radd_alerts__date <= "${endDate}"`;
        return `${DATASET_GLAD_RADD_WDPA}?sql=${sql}`;
    }

    static getURLForGeostore(startDate, endDate, geostoreId) {
        const sql = `SELECT wur_radd_alerts__confidence, SUM(alert__count) AS alert__count, SUM(alert_area__ha) AS alert_area__ha 
                     FROM data WHERE geostore__id="${geostoreId}" AND wur_radd_alerts__date >= "${startDate}" 
                     AND wur_radd_alerts__date <= "${endDate}"`;
        return `${DATASET_GLAD_RADD_GEOSTORE}?sql=${sql}`;
    }

    static getURLForDownload(startDate, endDate, geostoreId) {
        const sql = `SELECT latitude, longitude, wur_radd_alerts__date, wur_radd_alerts__confidence 
                     FROM data WHERE wur_radd_alerts__date >= "${startDate}" AND wur_radd_alerts__date <= "${endDate}"`;
        return `${DATASET_GLAD_RADD_DOWNLOAD}/{format}?sql=${sql}&geostore_origin=rw&geostore_id=${geostoreId}`;
    }

    static async getURLForSubscription(startDate, endDate, params) {
        if (!!params && !!params.iso && !!params.iso.country && !!params.iso.region && !!params.iso.subregion) {
            return GladRaddService.getURLForAdmin2(startDate, endDate, params.iso.country, params.iso.region, params.iso.subregion);
        }

        if (!!params && !!params.iso && !!params.iso.country && !!params.iso.region) {
            return GladRaddService.getURLForAdmin1(startDate, endDate, params.iso.country, params.iso.region);
        }

        if (!!params && !!params.iso && !!params.iso.country) {
            return GladRaddService.getURLForAdmin0(startDate, endDate, params.iso.country);
        }

        if (!!params && !!params.wdpaid) {
            return GladRaddService.getURLForWDPA(startDate, endDate, params.wdpaid);
        }

        const geostoreId = await GeostoreService.getGeostoreIdFromSubscriptionParams(params);
        return GladRaddService.getURLForGeostore(startDate, endDate, geostoreId);
    }

    static async getAlertsForSubscription(startDate, endDate, params) {
        logger.info('[GLAD-S2] Entering analysis with params', startDate, endDate, params);
        const url = await GladRaddService.getURLForSubscription(startDate, endDate, params);
        logger.info(`[GLAD-S2] Preparing Data API request, with URL ${config.get('dataApi.url')}${url}`);
        const response = await axios.get(
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

    static async getAlertsSamePeriodLastYearForSubscription(startDate, endDate, params) {
        const lastYearStartDate = moment(startDate).subtract('1', 'y');
        const lastYearEndDate = moment(endDate).subtract('1', 'y');
        return GladRaddService.getAlertsForSubscription(
            lastYearStartDate.format('YYYY-MM-DD'),
            lastYearEndDate.format('YYYY-MM-DD'),
            params
        );
    }

    static async getDownloadURLs(startDate, endDate, params) {
        const geostoreId = await GeostoreService.getGeostoreIdFromSubscriptionParams(params);
        const uri = GladRaddService.getURLForDownload(startDate, endDate, geostoreId);
        return {
            csv: `${config.get('dataApi.url')}${uri}`.replace('{format}', 'csv'),
            json: `${config.get('dataApi.url')}${uri}`.replace('{format}', 'json'),
        };
    }

}

module.exports = GladRaddService;
