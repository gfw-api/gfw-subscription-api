const logger = require('logger');
const moment = require('moment');
const config = require('config');
const ctRegisterMicroservice = require('ct-register-microservice-node');

class GLADPresenter {

    static async transform(results, layer, subscription, begin, end) {
        const startDate = moment(begin);
        const endDate = moment(end);
        const geostoreId = subscription.params.geostore;
        const sql = `SELECT * FROM data WHERE alert__date > '${startDate}' AND alert__date < '${endDate}' AND geostore__id = '${geostoreId}' ORDER BY alert__date`;
        const uri = `/query/${config.get('datasets.gladAlertsDataset')}?sql=${sql}`;

        logger.debug('Last alerts endpoint ', uri);
        try {
            const alerts = await ctRegisterMicroservice.requestToMicroservice({ uri, method: 'GET', json: true });
            results.alerts = alerts.data.map((el) => ({
                alert_type: 'GLAD',
                date: `${moment(el.alert__date).format('DD/MM/YYYY HH:MM')} UTC`,
            }));

            // TODO: fix these parameters
            results.image_url_big = 'example image';
            results.image_source = '';
            results.glad_frequency = 'normal';

            results.month = startDate.format('MMMM');
            results.year = startDate.format('YYYY');
            results.week_of = `${startDate.format('Do')} of ${startDate.format('MMMM')}`;
            results.week_start = startDate.format('DD/MM/YYYY');
            results.week_end = endDate.format('DD/MM/YYYY');
            results.glad_count = alerts.data.reduce((acc, curr) => acc + curr.alert__count, 0);
            results.alert_count = alerts.data.reduce((acc, curr) => acc + curr.alert__count, 0);

            // Calculate alerts grouped by area types
            let intactForestAlerts = 0;
            let primaryForestAlerts = 0;
            let peatAlerts = 0;
            let protectedAreasAlerts = 0;
            let plantationAlerts = 0;

            const useValueOrAlertCount = (val, count) => (Number.isInteger(val) ? Number.parseInt(val, 10) : count);

            alerts.data.forEach((al) => {
                if (al.intact_forest_landscapes_2016) {
                    intactForestAlerts += useValueOrAlertCount(al.intact_forest_landscapes_2016, al.alert__count);
                }

                if (al.is__regional_primary_forest) {
                    primaryForestAlerts += useValueOrAlertCount(al.is__regional_primary_forest, al.alert__count);
                }

                if (al.is__peat_land) {
                    peatAlerts += useValueOrAlertCount(al.is__peat_land, al.alert__count);
                }

                const wdpaKey = Object.keys(al).find((key) => /wdpa/.test(key));
                if (wdpaKey !== undefined) {
                    protectedAreasAlerts += useValueOrAlertCount(true, al.alert__count);
                }

                if (al.gfw_plantation__type !== 0 && al.gfw_plantation__type !== '0') {
                    plantationAlerts += useValueOrAlertCount(true, al.alert__count);
                }
            });

            const otherAlerts = results.glad_count - intactForestAlerts - primaryForestAlerts - peatAlerts - protectedAreasAlerts - plantationAlerts;

            results.priority_areas = {
                intact_forest: intactForestAlerts,
                primary_forest: primaryForestAlerts,
                peat: peatAlerts,
                protected_areas: protectedAreasAlerts,
                plantations: plantationAlerts,
                other: otherAlerts,
            };

            results.glad_alerts = {
                intact_forest: intactForestAlerts,
                primary_forest: primaryForestAlerts,
                peat: peatAlerts,
                protected_areas: protectedAreasAlerts,
                plantations: plantationAlerts,
                other: otherAlerts,
            };

        } catch (err) {
            logger.error(err);
            results.alerts = [];
        }
        logger.info('Glad P Results ', results);
        return results;
    }

}

module.exports = GLADPresenter;
