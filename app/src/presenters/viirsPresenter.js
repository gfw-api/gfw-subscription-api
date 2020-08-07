/* eslint-disable max-len */
const logger = require('logger');
const moment = require('moment');

const ViirsAlertsService = require('services/viirsAlertsService');
const EmailHelpersService = require('services/emailHelpersService');

class ViirsPresenter {

    static async transform(results, layer, subscription, begin, end) {
        EmailHelpersService.updateMonthTranslations();
        moment.locale(subscription.language || 'en');

        try {
            const startDate = moment(begin);
            const endDate = moment(end);

            const alerts = await ViirsAlertsService.getAnalysisInPeriodForSubscription(
                startDate.format('YYYY-MM-DD'),
                endDate.format('YYYY-MM-DD'),
                subscription.params
            );

            results.month = startDate.format('MMMM');
            results.year = startDate.format('YYYY');
            results.week_of = `${startDate.format('DD MMM')}`;
            results.week_start = startDate.format('DD/MM/YYYY');
            results.week_end = endDate.format('DD/MM/YYYY');
            results.viirs_count = alerts.reduce((acc, curr) => acc + curr.alert__count, 0);
            results.alert_count = alerts.reduce((acc, curr) => acc + curr.alert__count, 0);

            // Add download URLs
            results.downloadUrls = await ViirsAlertsService.getDownloadURLs(
                startDate.format('YYYY-MM-DD'),
                endDate.format('YYYY-MM-DD'),
                subscription.params
            );

            // Calculate alerts grouped by area types
            results.priority_areas = EmailHelpersService.calculateVIIRSPriorityAreaValues(alerts, results.alert_count);

            // Finding alerts for the same period last year and calculate frequency
            const lastYearAlerts = await ViirsAlertsService.getAnalysisSamePeriodLastYearForSubscription(begin, end, subscription.params);
            results.viirs_frequency = await EmailHelpersService.calculateAlertFrequency(alerts, lastYearAlerts, subscription.language);

            results.formatted_alert_count = EmailHelpersService.formatAlertCount(results.alert_count);
            results.formatted_priority_areas = EmailHelpersService.formatPriorityAreas(results.priority_areas);
        } catch (err) {
            logger.error(err);
            results.alerts = [];
        }
        logger.info('VIIRS Active Fires results: ', results);
        return results;
    }

}

module.exports = ViirsPresenter;
