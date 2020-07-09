const config = require('config');
const logger = require('logger');
const moment = require('moment');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const GeostoreService = require('services/geostoreService');

class GLADAlertsService {

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
            sql += `AND adm1 = '${region}' `;
        }

        if (subregion) {
            sql += `AND adm2 = '${subregion}' `;
        }

        sql += ' ORDER BY alert__date';

        return `/query/${config.get('datasets.gladISODataset')}?sql=${sql}`;
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
        return `/query/${config.get('datasets.gladWDPADataset')}?sql=${sql}`;
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
        return `/query/${config.get('datasets.gladGeostoreDataset')}?sql=${sql}`;
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
        logger.info('Entering GLAD analysis endpoint with params', startDate, endDate, params);

        let uri;
        if (params && params.iso) {
            uri = GLADAlertsService.getURLInPeriodForISO(startDate, endDate, params);
        } else if (params && params.wdpaid) {
            uri = GLADAlertsService.getURLInPeriodForWDPA(startDate, endDate, params);
        } else {
            const geostoreId = await GeostoreService.getGeostoreIdFromSubscriptionParams(params);
            uri = GLADAlertsService.getURLInPeriodForGeostore(startDate, endDate, geostoreId);
        }

        const response = await ctRegisterMicroservice.requestToMicroservice({ uri, method: 'GET', json: true });
        return response.data;
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
        return GLADAlertsService.getAnalysisInPeriodForSubscription(
            lastYearStartDate.format('YYYY-MM-DD'),
            lastYearEndDate.format('YYYY-MM-DD'),
            params
        );
    }

}

module.exports = GLADAlertsService;
