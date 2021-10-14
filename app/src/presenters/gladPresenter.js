const logger = require('logger');
const moment = require('moment');
const AlertUrlService = require('services/alertUrlService');
const GLADAlertsService = require('services/gladAlertsService');
const EmailHelpersService = require('services/emailHelpersService');
const UrlService = require('services/urlService');

class GLADPresenter {

    static buildResultObject(results, layer, subscription, begin, end) {
        const resultObject = { value: results.value };
        EmailHelpersService.updateMonthTranslations();
        moment.locale(subscription.language || 'en');

        const startDate = moment(begin);
        const endDate = moment(end);

        resultObject.month = startDate.format('MMMM');
        resultObject.year = startDate.format('YYYY');
        resultObject.week_of = `${startDate.format('DD MMM')}`;
        resultObject.week_start = startDate.format('DD/MM/YYYY');
        resultObject.week_end = endDate.format('DD/MM/YYYY');
        resultObject.glad_count = results.data.reduce((acc, curr) => acc + curr.alert__count, 0);
        resultObject.alert_count = results.data.reduce((acc, curr) => acc + curr.alert__count, 0);

        resultObject.priority_areas = EmailHelpersService.calculateGLADPriorityAreaValues(results.data, resultObject.alert_count);
        resultObject.formatted_alert_count = EmailHelpersService.formatAlertCount(resultObject.alert_count);
        resultObject.formatted_priority_areas = EmailHelpersService.formatPriorityAreas(resultObject.priority_areas);

        resultObject.alert_link = AlertUrlService.generate(subscription, layer, begin, end);
        resultObject.dashboard_link = UrlService.dashboardUrl(subscription.id, subscription.language, 'glad');
        resultObject.map_url_intact_forest = AlertUrlService.generateIntactForestMapURL(subscription, layer, begin, end);
        resultObject.map_url_primary_forest = AlertUrlService.generatePrimaryForestMapURL(subscription, layer, begin, end);
        resultObject.map_url_peat = AlertUrlService.generatePeatMapURL(subscription, layer, begin, end);
        resultObject.map_url_wdpa = AlertUrlService.generateWDPAMapURL(subscription, layer, begin, end);

        return resultObject;
    }

    static async transform(results, layer, subscription, begin, end) {
        try {
            const resultObject = GLADPresenter.buildResultObject(results, layer, subscription, begin, end);

            resultObject.downloadUrls = await GLADAlertsService.getDownloadURLs(
                moment(begin).format('YYYY-MM-DD'),
                moment(end).format('YYYY-MM-DD'),
                subscription.params
            );

            const lastYearAlerts = await GLADAlertsService.getAnalysisSamePeriodLastYearForSubscription(begin, end, subscription.params);
            resultObject.glad_frequency = await EmailHelpersService.calculateAlertFrequency(results.data, lastYearAlerts, subscription.language);

            logger.info('GLAD results ', resultObject);
            return resultObject;

        } catch (err) {
            logger.error(err);
            results.alerts = [];
            throw err;
        }
    }

}

module.exports = GLADPresenter;
