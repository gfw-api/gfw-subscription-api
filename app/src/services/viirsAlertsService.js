const config = require('config');
const logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');

class ViirsAlertsService {

    /**
     * Gets the alert data for the period and geostore provided.
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
        return `/query/${config.get('datasets.viirsAlertsDataset')}?sql=${sql}`;
    }

    /**
     * Gets the alert data for the period and geostore provided.
     *
     * @param {string} startDate YYYY-MM-DD formatted date representing the start date of the period.
     * @param {string} endDate YYYY-MM-DD formatted date representing the end date of the period.
     * @param {string} geostoreId The ID of the geostore.
     *
     * @returns {Promise<[Object]>} A promise resolving into an array of alerts.
     */
    static async getAnalysisInPeriodForGeostore(startDate, endDate, geostoreId) {
        logger.info('Entering VIIRS Fires analysis endpoint with params', startDate, endDate, geostoreId);
        const uri = ViirsAlertsService.getURLInPeriodForGeostore(startDate, endDate, geostoreId);
        const response = await ctRegisterMicroservice.requestToMicroservice({ uri, method: 'GET', json: true });
        return response.data;
    }

}

module.exports = ViirsAlertsService;
