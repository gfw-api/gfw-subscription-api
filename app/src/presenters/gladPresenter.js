const logger = require('logger');
const moment = require('moment');
const ctRegisterMicroservice = require('ct-register-microservice-node');

class GLADPresenter {

    static async transform(results, layer, subscription, begin, end) {
        const startDate = moment(begin);
        const endDate = moment(end);
        const geostoreId = subscription.params.geostore;
        const sql = `SELECT * FROM data WHERE alert__date > '${startDate}' AND alert__date < '${endDate}' AND geostore__id = '${geostoreId}' ORDER BY alert__date`;
        const uri = `/query/9be3bf63-97fc-4bb0-b913-775ccae3cf9e?sql=${sql}`;

        logger.debug('Last alerts endpoint ', uri);
        try {
            const alerts = await ctRegisterMicroservice.requestToMicroservice({ uri, method: 'GET', json: true });
            // TODO: missing lat and long
            results.alerts = alerts.data.map((el) => ({
                alert_type: 'GLAD',
                date: `${moment(el.alert__date).format('DD/MM/YYYY HH:MM')} UTC`,
            }));

            // TODO: fix these parameters
            results.image_url_big = 'example image';
            results.image_source = '';
            results.glad_frequency = 'normal';
            results.priority_areas = {
                intact_forest: 1,
                primary_forest: 1,
                peat: 1,
                protected_areas: 12,
                plantations: 15,
                other: 3
            };
            results.glad_alerts = {
                intact_forest: 1,
                primary_forest: 1,
                peat: 1,
                protected_areas: 12,
                plantations: 15,
                other: 3
            };

            results.month = startDate.format('MMMM');
            results.year = startDate.format('YYYY');
            results.week_of = `${startDate.format('Do')} of ${startDate.format('MMMM')}`;
            results.week_start = startDate.format('DD/MM/YYYY');
            results.week_end = endDate.format('DD/MM/YYYY');
            results.glad_count = alerts.data.reduce((acc, curr) => acc + curr.alert__count, 0);
            results.alert_count = results.value;
        } catch (err) {
            logger.error(err);
            results.alerts = [];
        }
        logger.info('Glad P Results ', results);
        return results;
    }

}

module.exports = GLADPresenter;
