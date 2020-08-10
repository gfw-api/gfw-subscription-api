const logger = require('logger');
const moment = require('moment');

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

            results.month = startDate.format('MMMM');
            results.year = startDate.format('YYYY');
            results.week_of = `${startDate.format('DD MMM')}`;
            results.week_start = startDate.format('DD/MM/YYYY');
            results.week_end = endDate.format('DD/MM/YYYY');
            results.glad_count = gladAlerts.reduce((acc, curr) => acc + curr.alert__count, 0);
            results.viirs_count = viirsAlerts.reduce((acc, curr) => acc + curr.alert__count, 0);
            results.alert_count = allAlerts.reduce((acc, curr) => acc + curr.alert__count, 0);

            // Find values for priority areas
            results.glad_alerts = EmailHelpersService.calculateGLADPriorityAreaValues(gladAlerts, results.glad_count);
            results.viirs_alerts = EmailHelpersService.calculateVIIRSPriorityAreaValues(viirsAlerts, results.viirs_count);
            results.priority_areas = {
                intact_forest: results.glad_alerts.intact_forest + results.viirs_alerts.intact_forest,
                primary_forest: results.glad_alerts.primary_forest + results.viirs_alerts.primary_forest,
                peat: results.glad_alerts.peat + results.viirs_alerts.peat,
                protected_areas: results.glad_alerts.protected_areas + results.viirs_alerts.protected_areas,
                plantations: results.glad_alerts.plantations + results.viirs_alerts.plantations,
                other: results.glad_alerts.other + results.viirs_alerts.other,
            };

            // Finding alerts for the same period last year and calculate frequency
            const gladLastYearAlerts = await GLADAlertsService.getAnalysisSamePeriodLastYearForSubscription(
                begin, end, subscription.params
            );
            results.glad_frequency = await EmailHelpersService.calculateAlertFrequency(gladAlerts, gladLastYearAlerts, subscription.language);

            // Finding alerts for the same period last year and calculate frequency
            const viirsLastYearAlerts = await ViirsAlertsService.getAnalysisSamePeriodLastYearForSubscription(begin, end, subscription.params);
            results.viirs_frequency = await EmailHelpersService.calculateAlertFrequency(viirsAlerts, viirsLastYearAlerts, subscription.language);

            // VIIRS specific properties
            results.viirs_days_count = endDate.diff(startDate, 'days');
            results.viirs_day_start = startDate.format('DD/MM/YYYY');
            results.viirs_day_end = endDate.format('DD/MM/YYYY');
            results.location = subscription.name;

            results.formatted_alert_count = EmailHelpersService.formatAlertCount(results.alert_count);
            results.formatted_glad_count = EmailHelpersService.formatAlertCount(results.glad_count);
            results.formatted_viirs_count = EmailHelpersService.formatAlertCount(results.viirs_count);
            results.formatted_priority_areas = EmailHelpersService.formatPriorityAreas(results.priority_areas);
            results.formatted_glad_priority_areas = EmailHelpersService.formatPriorityAreas(results.glad_alerts);
            results.formatted_viirs_priority_areas = EmailHelpersService.formatPriorityAreas(results.viirs_alerts);
        } catch (err) {
            logger.error(err);
            results.alerts = [];
        }
        logger.info('Glad P Results ', results);
        return results;
    }

}

module.exports = MonthlySummaryPresenter;
