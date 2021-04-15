const axios = require('axios');
const config = require('config');
const logger = require('logger');
const moment = require('moment');

const GeostoreService = require('services/geostoreService');

class ViirsAlertsService {

    /**
     * Returns the URL that should be used to fetch alerts for a subscription related to an ISO.
     *
     * @param {string} startDate YYYY-MM-DD formatted date representing the start date of the period.
     * @param {string} endDate YYYY-MM-DD formatted date representing the end date of the period.
     * @param {Object} params Params containing the ISO info that should be used.
     *
     * @returns {string} The URL that should be used to fetch the alerts.
     */
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

        return `/dataset/${config.get('datasets.viirsISODataset')}/latest/query?sql=${sql}`;
    }

    /**
     * Returns the URL that should be used to fetch alerts for a subscription related to a WDPA.
     *
     * @param {string} startDate YYYY-MM-DD formatted date representing the start date of the period.
     * @param {string} endDate YYYY-MM-DD formatted date representing the end date of the period.
     * @param {Object} params Params containing the WDPA info that should be used.
     *
     * @returns {string} The URL that should be used to fetch the alerts.
     */
    static getURLInPeriodForWDPA(startDate, endDate, params = {}) {
        const { wdpaid } = params;
        let sql = `SELECT * FROM data WHERE alert__date > '${startDate}' AND alert__date <= '${endDate}' `;
        sql += `AND wdpa_protected_area__id = '${wdpaid}'`;
        sql += ' ORDER BY alert__date';
        return `/dataset/${config.get('datasets.viirsWDPADataset')}/latest/query?sql=${sql}`;
    }

    /**
     * Returns the URL that should be used to fetch alerts for a subscription related to a geostore.
     *
     * @param {string} startDate YYYY-MM-DD formatted date representing the start date of the period.
     * @param {string} endDate YYYY-MM-DD formatted date representing the end date of the period.
     * @param {string} geostoreId The ID of the geostore.
     *
     * @returns {string} The URL that should be used to fetch the alerts.
     */
    static getURLInPeriodForGeostore(startDate, endDate, geostoreId) {
        const sql = `SELECT * FROM data WHERE alert__date > '${startDate}' AND alert__date <= '${endDate}' `
            + `AND geostore__id = '${geostoreId}' ORDER BY alert__date`;
        return `/dataset/${config.get('datasets.viirsGeostoreDataset')}/latest/query?sql=${sql}`;
    }

    /**
     * Returns the URL for the query for VIIRS alerts for the provided period (startDate to endDate). The params are
     * taken into account to decide which dataset will be used to fetch the alerts.
     *
     * @param startDate
     * @param endDate
     * @param params
     * @returns {Promise<*>}
     */
    static async getURLInPeriodForSubscription(startDate, endDate, params) {
        // At least country must be defined to use the ISO dataset
        if (!!params && !!params.iso && !!params.iso.country) {
            return ViirsAlertsService.getURLInPeriodForISO(startDate, endDate, params);
        }

        if (!!params && !!params.wdpaid) {
            return ViirsAlertsService.getURLInPeriodForWDPA(startDate, endDate, params);
        }

        const geostoreId = await GeostoreService.getGeostoreIdFromSubscriptionParams(params);
        return ViirsAlertsService.getURLInPeriodForGeostore(startDate, endDate, geostoreId);
    }

    /**
     * Returns an array of GLAD alerts for the provided period (startDate to endDate). The params are
     * taken into account to decide which dataset will be used to fetch the alerts.
     *
     * @param startDate
     * @param endDate
     * @param params
     * @returns {Promise<*>}
     */
    static async getAnalysisInPeriodForSubscription(startDate, endDate, params) {
        logger.info('Entering VIIRS analysis endpoint with params', startDate, endDate, params);
        const uri = await ViirsAlertsService.getURLInPeriodForSubscription(startDate, endDate, params);
        const response = await axios.get(`${config.get('dataApi.url')}${uri}`);
        return response.data.data;
    }

    /**
     * Returns an array of GLAD alerts for the corresponding period of the last year for the dates provided (startDate to endDate).
     *
     * @param startDate
     * @param endDate
     * @param params
     * @returns {Promise<*>}
     */
    static async getAnalysisSamePeriodLastYearForSubscription(startDate, endDate, params) {
        const lastYearStartDate = moment(startDate).subtract('1', 'y');
        const lastYearEndDate = moment(endDate).subtract('1', 'y');
        return ViirsAlertsService.getAnalysisInPeriodForSubscription(
            lastYearStartDate.format('YYYY-MM-DD'),
            lastYearEndDate.format('YYYY-MM-DD'),
            params
        );
    }

    /**
     * Returns an object with URLs for downloading VIIRS alerts for the provided period and subscription.
     *
     * @param startDate
     * @param endDate
     * @param params
     * @returns {Promise<{csv: string, json: string}>}
     */
    static async getDownloadURLs(startDate, endDate, params) {
        const uri = await ViirsAlertsService.getURLInPeriodForSubscription(startDate, endDate, params);
        return { csv: uri.replace('/query', '/download/csv'), json: uri.replace('/query', '/download/json') };
    }

}

module.exports = ViirsAlertsService;
