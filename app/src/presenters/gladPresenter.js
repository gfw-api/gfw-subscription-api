/* eslint-disable max-len */
const logger = require('logger');
const moment = require('moment');

const GLADAlertsService = require('services/gladAlertsService');
const EmailHelpersService = require('services/emailHelpersService');

class GLADPresenter {

    static async transform(results, layer, subscription, begin, end) {
        const resultObject = { value: results.value };
        EmailHelpersService.updateMonthTranslations();
        moment.locale(subscription.language || 'en');

        try {
            const startDate = moment(begin);
            const endDate = moment(end);

            resultObject.month = startDate.format('MMMM');
            resultObject.year = startDate.format('YYYY');
            resultObject.week_of = `${startDate.format('DD MMM')}`;
            resultObject.week_start = startDate.format('DD/MM/YYYY');
            resultObject.week_end = endDate.format('DD/MM/YYYY');
            resultObject.glad_count = results.data.reduce((acc, curr) => acc + curr.alert__count, 0);
            resultObject.alert_count = results.data.reduce((acc, curr) => acc + curr.alert__count, 0);

            // Add download URLs
            resultObject.downloadUrls = await GLADAlertsService.getDownloadURLs(
                startDate.format('YYYY-MM-DD'),
                endDate.format('YYYY-MM-DD'),
                subscription.params
            );

            // Find values for priority areas
            resultObject.priority_areas = EmailHelpersService.calculateGLADPriorityAreaValues(results.data, resultObject.alert_count);
            resultObject.formatted_alert_count = EmailHelpersService.formatAlertCount(resultObject.alert_count);
            resultObject.formatted_priority_areas = EmailHelpersService.formatPriorityAreas(resultObject.priority_areas);

            // Finding alerts for the same period last year and calculate frequency
            const lastYearAlerts = await GLADAlertsService.getAnalysisSamePeriodLastYearForSubscription(begin, end, subscription.params);
            resultObject.glad_frequency = await EmailHelpersService.calculateAlertFrequency(results.data, lastYearAlerts, subscription.language);

        } catch (err) {
            logger.error(err);
            results.alerts = [];
            throw err;
        }

        logger.info('Glad P Results ', resultObject);
        return resultObject;
    }

}

module.exports = GLADPresenter;
