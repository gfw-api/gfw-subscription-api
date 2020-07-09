/* eslint-disable max-len */
const logger = require('logger');
const moment = require('moment');
const config = require('config');
const GeostoreService = require('services/geostoreService');
const GLADAlertsService = require('services/gladAlertsService');
const ViirsAlertsService = require('services/viirsAlertsService');
const EmailHelpersService = require('services/emailHelpersService');

class MonthlySummaryPresenter {

    static async transform(results, layer, subscription, begin, end) {
        EmailHelpersService.updateMonthTranslations();
        moment.locale(subscription.language || 'en');

        try {
            const startDate = moment(begin);
            const endDate = moment(end);

            // Find geostore id for the subscription params
            const geostoreId = await GeostoreService.getGeostoreIdFromSubscriptionParams(subscription.params);

            // Find all needed alerts
            const gladAlerts = await GLADAlertsService.getAnalysisInPeriodForSubscription(
                startDate.format('YYYY-MM-DD'),
                endDate.format('YYYY-MM-DD'),
                subscription.params,
            );

            const viirsAlerts = await ViirsAlertsService.getAnalysisInPeriodForSubscription(
                startDate.format('YYYY-MM-DD'),
                endDate.format('YYYY-MM-DD'),
                subscription.params,
            );

            const allAlerts = [];
            gladAlerts.forEach((alert) => allAlerts.push({ ...alert, type: 'GLAD' }));
            viirsAlerts.forEach((alert) => allAlerts.push({ ...alert, type: 'VIIRS' }));

            results.alerts = allAlerts.map((alert) => ({
                alert_type: alert.type,
                date: `${moment(alert.alert__date).format('DD/MM/YYYY HH:MM')} UTC`,
            }));
            results.month = startDate.format('MMMM');
            results.year = startDate.format('YYYY');
            results.week_of = `${startDate.format('DD MMM')}`;
            results.week_start = startDate.format('DD/MM/YYYY');
            results.week_end = endDate.format('DD/MM/YYYY');
            results.glad_count = gladAlerts.reduce((acc, curr) => acc + curr.alert__count, 0);
            results.viirs_count = viirsAlerts.reduce((acc, curr) => acc + curr.alert__count, 0);
            results.alert_count = allAlerts.reduce((acc, curr) => acc + curr.alert__count, 0);
            results.downloadUrls = {
                glad: {
                    csv: `${config.get('apiGateway.externalUrl')}/glad-alerts/download/?period=${startDate.format('YYYY-MM-DD')},${endDate.format('YYYY-MM-DD')}&gladConfirmOnly=False&aggregate_values=False&aggregate_by=False&geostore=${geostoreId}&format=csv`,
                    json: `${config.get('apiGateway.externalUrl')}/glad-alerts/download/?period=${startDate.format('YYYY-MM-DD')},${endDate.format('YYYY-MM-DD')}&gladConfirmOnly=False&aggregate_values=False&aggregate_by=False&geostore=${geostoreId}&format=json`,
                },
                viirs: {
                    csv: `${config.get('apiGateway.externalUrl')}/viirs-active-fires/download/?period=${startDate.format('YYYY-MM-DD')},${endDate.format('YYYY-MM-DD')}&aggregate_values=False&aggregate_by=False&geostore=${geostoreId}&format=csv`,
                    json: `${config.get('apiGateway.externalUrl')}/viirs-active-fires/download/?period=${startDate.format('YYYY-MM-DD')},${endDate.format('YYYY-MM-DD')}&aggregate_values=False&aggregate_by=False&geostore=${geostoreId}&format=json`,
                }
            };

            // Find values for priority areas
            results.glad_priority_areas = EmailHelpersService.calculateGLADPriorityAreaValues(allAlerts, results.alert_count);
            results.viirs_priority_areas = EmailHelpersService.calculateVIIRSPriorityAreaValues(allAlerts, results.alert_count);
            results.all_priority_areas = {
                intact_forest: results.glad_priority_areas.intact_forest + results.viirs_priority_areas.intact_forest,
                primary_forest: results.glad_priority_areas.primary_forest + results.viirs_priority_areas.primary_forest,
                peat: results.glad_priority_areas.peat + results.viirs_priority_areas.peat,
                protected_areas: results.glad_priority_areas.protected_areas + results.viirs_priority_areas.protected_areas,
                plantations: results.glad_priority_areas.plantations + results.viirs_priority_areas.plantations,
                other: results.glad_priority_areas.other + results.viirs_priority_areas.other,
            };

            // Finding alerts for the same period last year and calculate frequency
            const gladLastYearAlerts = await GLADAlertsService.getAnalysisSamePeriodLastYearForSubscription(
                begin, end, subscription.params
            );
            results.glad_frequency = await EmailHelpersService.calculateAlertFrequency(gladAlerts, gladLastYearAlerts, subscription.language);

            // Finding alerts for the same period last year and calculate frequency
            const viirsLastYearAlerts = await ViirsAlertsService.getAnalysisSamePeriodLastYearForSubscription(begin, end, subscription.params);
            results.viirs_frequency = await EmailHelpersService.calculateAlertFrequency(viirsAlerts, viirsLastYearAlerts, subscription.language);

        } catch (err) {
            logger.error(err);
            results.alerts = [];
        }
        logger.info('Glad P Results ', results);
        return results;
    }

}

module.exports = MonthlySummaryPresenter;
