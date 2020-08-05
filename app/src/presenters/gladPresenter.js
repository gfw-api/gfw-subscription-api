/* eslint-disable max-len */
const logger = require('logger');
const moment = require('moment');
const config = require('config');
const GeostoreService = require('services/geostoreService');
const GLADAlertsService = require('services/gladAlertsService');
const EmailHelpersService = require('services/emailHelpersService');

class GLADPresenter {

    static async transform(results, layer, subscription, begin, end) {
        EmailHelpersService.updateMonthTranslations();
        moment.locale(subscription.language || 'en');

        try {
            const startDate = moment(begin);
            const endDate = moment(end);
            const alerts = await GLADAlertsService.getAnalysisInPeriodForSubscription(
                startDate.format('YYYY-MM-DD'),
                endDate.format('YYYY-MM-DD'),
                subscription.params
            );

            results.month = startDate.format('MMMM');
            results.year = startDate.format('YYYY');
            results.week_of = `${startDate.format('DD MMM')}`;
            results.week_start = startDate.format('DD/MM/YYYY');
            results.week_end = endDate.format('DD/MM/YYYY');
            results.glad_count = alerts.reduce((acc, curr) => acc + curr.alert__count, 0);
            results.alert_count = alerts.reduce((acc, curr) => acc + curr.alert__count, 0);
            const geostoreId = await GeostoreService.getGeostoreIdFromSubscriptionParams(subscription.params);
            results.downloadUrls = {
                csv: `${config.get('apiGateway.externalUrl')}/glad-alerts/download/?period=${startDate.format('YYYY-MM-DD')},${endDate.format('YYYY-MM-DD')}&gladConfirmOnly=False&aggregate_values=False&aggregate_by=False&geostore=${geostoreId}&format=csv`,
                json: `${config.get('apiGateway.externalUrl')}/glad-alerts/download/?period=${startDate.format('YYYY-MM-DD')},${endDate.format('YYYY-MM-DD')}&gladConfirmOnly=False&aggregate_values=False&aggregate_by=False&geostore=${geostoreId}&format=json`,
            };

            // Find values for priority areas
            results.priority_areas = EmailHelpersService.calculateGLADPriorityAreaValues(alerts, results.alert_count);

            // Finding alerts for the same period last year and calculate frequency
            const lastYearAlerts = await GLADAlertsService.getAnalysisSamePeriodLastYearForSubscription(begin, end, subscription.params);
            results.glad_frequency = await EmailHelpersService.calculateAlertFrequency(alerts, lastYearAlerts, subscription.language);

            results.formatted_alert_count = EmailHelpersService.formatAlertCount(results.alert_count);
            results.formatted_priority_areas = EmailHelpersService.formatPriorityAreas(results.priority_areas);
        } catch (err) {
            logger.error(err);
            results.alerts = [];
        }
        logger.info('Glad P Results ', results);
        return results;
    }

}

module.exports = GLADPresenter;
