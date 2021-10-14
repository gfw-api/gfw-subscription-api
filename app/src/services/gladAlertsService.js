const axios = require('axios');
const config = require('config');
const logger = require('logger');
const moment = require('moment');

const GeostoreService = require('services/geostoreService');

class GLADAlertsService {

    static getURLInPeriodForISO(startDate, endDate, params = {}) {
        const { country, region, subregion } = params.iso;
        let sql = `SELECT * FROM data WHERE alert__date > '${startDate}' AND alert__date <= '${endDate}' `;

        if (country) {
            sql += `AND iso = '${country}' `;
        }

        if (region) {
            sql += `AND adm1 = ${region} `;
        }

        if (subregion) {
            sql += `AND adm2 = ${subregion} `;
        }

        sql += ' ORDER BY alert__date';

        return `/dataset/${config.get('datasets.gladISODataset')}/latest/query?sql=${sql}`;
    }

    static getURLInPeriodForWDPA(startDate, endDate, params = {}) {
        const { wdpaid } = params;
        let sql = `SELECT * FROM data WHERE alert__date > '${startDate}' AND alert__date <= '${endDate}' `;
        sql += `AND wdpa_protected_area__id = '${wdpaid}'`;
        sql += ' ORDER BY alert__date';
        return `/dataset/${config.get('datasets.gladWDPADataset')}/latest/query?sql=${sql}`;
    }

    static getURLInPeriodForGeostore(startDate, endDate, geostoreId) {
        const sql = `SELECT * FROM data WHERE alert__date > '${startDate}' AND alert__date <= '${endDate}' `
            + `AND geostore__id = '${geostoreId}' ORDER BY alert__date`;
        return `/dataset/${config.get('datasets.gladGeostoreDataset')}/latest/query?sql=${sql}`;
    }

    static async getURLInPeriodForSubscription(startDate, endDate, params) {
        // At least country must be defined to use the ISO dataset
        if (!!params && !!params.iso && !!params.iso.country) {
            return GLADAlertsService.getURLInPeriodForISO(startDate, endDate, params);
        }

        if (!!params && !!params.wdpaid) {
            return GLADAlertsService.getURLInPeriodForWDPA(startDate, endDate, params);
        }

        const geostoreId = await GeostoreService.getGeostoreIdFromSubscriptionParams(params);
        return GLADAlertsService.getURLInPeriodForGeostore(startDate, endDate, geostoreId);
    }

    static async getAnalysisInPeriodForSubscription(startDate, endDate, params) {
        logger.info('[GLAD] Entering analysis with params', startDate, endDate, params);
        const uri = await GLADAlertsService.getURLInPeriodForSubscription(startDate, endDate, params);
        logger.info(`[GLAD] Preparing Data API request, with URL ${config.get('dataApi.url')}${uri}`);
        const response = await axios.get(
            `${config.get('dataApi.url')}${uri}`,
            {
                headers: {
                    'x-api-key': config.get('dataApi.apiKey'),
                    origin: config.get('dataApi.origin'),
                }
            }
        );
        return response.data.data;
    }

    static async getAnalysisSamePeriodLastYearForSubscription(startDate, endDate, params) {
        const lastYearStartDate = moment(startDate).subtract('1', 'y');
        const lastYearEndDate = moment(endDate).subtract('1', 'y');
        return GLADAlertsService.getAnalysisInPeriodForSubscription(
            lastYearStartDate.format('YYYY-MM-DD'),
            lastYearEndDate.format('YYYY-MM-DD'),
            params
        );
    }

    static getURLInPeriodForDownload(startDate, endDate, geostoreId) {
        const sql = `SELECT latitude, longitude, umd_glad_landsat_alerts__date, umd_glad_landsat_alerts__confidence, `
            + `is__ifl_intact_forest_landscapes as in_intact_forest, is__umd_regional_primary_forest_2001 as in_primary_forest, `
            + `is__gfw_peatlands as in_peat, is__wdpa_protected_areas as in_protected_areas `
            + `FROM ${config.get('datasets.gladDownloadDataset')} `
            + `WHERE umd_glad_landsat_alerts__date > '${startDate}' AND umd_glad_landsat_alerts__date <= '${endDate}'`;
        return `/dataset/${config.get('datasets.gladDownloadDataset')}/latest/download/{format}?sql=${sql}&geostore_id=${geostoreId}&geostore_origin=rw`;
    }

    static async getDownloadURLs(startDate, endDate, params) {
        const geostoreId = await GeostoreService.getGeostoreIdFromSubscriptionParams(params);
        const uri = GLADAlertsService.getURLInPeriodForDownload(startDate, endDate, geostoreId);
        return {
            csv: `${config.get('dataApi.url')}${uri}`.replace('{format}', 'csv'),
            json: `${config.get('dataApi.url')}${uri}`.replace('{format}', 'json'),
        };
    }

}

module.exports = GLADAlertsService;
