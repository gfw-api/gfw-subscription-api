const logger = require('logger');
const moment = require('moment');

const AlertUrlService = require('services/alertUrlService');
const Layer = require('models/layer');
const GLADAlertsService = require('services/gladAlertsService');
const ViirsAlertsService = require('services/viirsAlertsService');
const EmailHelpersService = require('services/emailHelpersService');
const UrlService = require('services/urlService');

class MonthlySummaryPresenter {

    static async transform(results, layer, subscription, begin, end) {
        const resultObject = { value: results.value };
        EmailHelpersService.updateMonthTranslations();
        moment.locale(subscription.language || 'en');

        try {
            const gladAlerts = results.data.filter((el) => el.type === 'GLAD');
            const viirsAlerts = results.data.filter((el) => el.type === 'VIIRS');

            const startDate = moment(begin);
            const endDate = moment(end);
            resultObject.month = startDate.format('MMMM');
            resultObject.year = startDate.format('YYYY');
            resultObject.week_of = `${startDate.format('DD MMM')}`;
            resultObject.week_start = startDate.format('DD/MM/YYYY');
            resultObject.week_end = endDate.format('DD/MM/YYYY');
            resultObject.glad_count = gladAlerts.reduce((acc, curr) => acc + curr.alert__count, 0);
            resultObject.viirs_count = viirsAlerts.reduce((acc, curr) => acc + curr.alert__count, 0);
            resultObject.alert_count = results.data.reduce((acc, curr) => acc + curr.alert__count, 0);

            // Find values for priority areas
            resultObject.glad_alerts = EmailHelpersService.calculateGLADPriorityAreaValues(gladAlerts, resultObject.glad_count);
            resultObject.viirs_alerts = EmailHelpersService.calculateVIIRSPriorityAreaValues(viirsAlerts, resultObject.viirs_count);
            resultObject.priority_areas = {
                intact_forest: resultObject.glad_alerts.intact_forest + resultObject.viirs_alerts.intact_forest,
                primary_forest: resultObject.glad_alerts.primary_forest + resultObject.viirs_alerts.primary_forest,
                peat: resultObject.glad_alerts.peat + resultObject.viirs_alerts.peat,
                protected_areas: resultObject.glad_alerts.protected_areas + resultObject.viirs_alerts.protected_areas,
                plantations: resultObject.glad_alerts.plantations + resultObject.viirs_alerts.plantations,
                other: resultObject.glad_alerts.other + resultObject.viirs_alerts.other,
            };

            // VIIRS specific properties
            resultObject.viirs_days_count = endDate.diff(startDate, 'days');
            resultObject.viirs_day_start = startDate.format('DD/MM/YYYY');
            resultObject.viirs_day_end = endDate.format('DD/MM/YYYY');
            resultObject.location = subscription.name;

            resultObject.formatted_alert_count = EmailHelpersService.formatAlertCount(resultObject.alert_count);
            resultObject.formatted_glad_count = EmailHelpersService.formatAlertCount(resultObject.glad_count);
            resultObject.formatted_viirs_count = EmailHelpersService.formatAlertCount(resultObject.viirs_count);
            resultObject.formatted_priority_areas = EmailHelpersService.formatPriorityAreas(resultObject.priority_areas);
            resultObject.formatted_glad_priority_areas = EmailHelpersService.formatPriorityAreas(resultObject.glad_alerts);
            resultObject.formatted_viirs_priority_areas = EmailHelpersService.formatPriorityAreas(resultObject.viirs_alerts);

            // Finding alerts for the same period last year and calculate frequency
            const gladLastYearAlerts = await GLADAlertsService.getAnalysisSamePeriodLastYearForSubscription(begin, end, subscription.params);
            resultObject.glad_frequency = await EmailHelpersService.calculateAlertFrequency(gladAlerts, gladLastYearAlerts, subscription.language);

            // Finding alerts for the same period last year and calculate frequency
            const viirsLastYearAlerts = await ViirsAlertsService.getAnalysisSamePeriodLastYearForSubscription(begin, end, subscription.params);
            resultObject.viirs_frequency = await EmailHelpersService.calculateAlertFrequency(viirsAlerts, viirsLastYearAlerts, subscription.language);

            // Set URLs
            resultObject.alert_link = AlertUrlService.generateForManyLayers(subscription, [
                Layer.findBySlug('glad-alerts'),
                Layer.findBySlug('viirs-active-fires'),
            ], begin, end);
            resultObject.dashboard_link = UrlService.dashboardUrl(subscription.id, subscription.language, 'forest-change');

        } catch (err) {
            logger.error(err);
            results.alerts = [];
            throw err;
        }

        logger.info('Glad P Results ', results);
        return resultObject;
    }

}

module.exports = MonthlySummaryPresenter;
