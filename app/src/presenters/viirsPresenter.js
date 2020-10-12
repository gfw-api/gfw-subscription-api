/* eslint-disable max-len */
const logger = require('logger');
const moment = require('moment');

const ViirsAlertsService = require('services/viirsAlertsService');
const EmailHelpersService = require('services/emailHelpersService');

class ViirsPresenter {

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
            resultObject.viirs_count = results.data.reduce((acc, curr) => acc + curr.alert__count, 0);
            resultObject.alert_count = results.data.reduce((acc, curr) => acc + curr.alert__count, 0);

            // Add download URLs
            resultObject.downloadUrls = await ViirsAlertsService.getDownloadURLs(
                startDate.format('YYYY-MM-DD'),
                endDate.format('YYYY-MM-DD'),
                subscription.params
            );

            // Calculate alerts grouped by area types
            resultObject.priority_areas = EmailHelpersService.calculateVIIRSPriorityAreaValues(results.data, resultObject.alert_count);
            resultObject.formatted_alert_count = EmailHelpersService.formatAlertCount(resultObject.alert_count);
            resultObject.formatted_priority_areas = EmailHelpersService.formatPriorityAreas(resultObject.priority_areas);

            // Finding alerts for the same period last year and calculate frequency
            const lastYearAlerts = await ViirsAlertsService.getAnalysisSamePeriodLastYearForSubscription(begin, end, subscription.params);
            resultObject.viirs_frequency = await EmailHelpersService.calculateAlertFrequency(results.data, lastYearAlerts, subscription.language);

        } catch (err) {
            logger.error(err);
            results.alerts = [];
            throw err;
        }

        logger.info('VIIRS Active Fires results: ', results);
        return resultObject;
    }

}

module.exports = ViirsPresenter;
