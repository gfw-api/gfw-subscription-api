/* eslint-disable max-len */
const _ = require('lodash');
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
            results.priority_areas = EmailHelpersService.calculatePriorityAreaValues(allAlerts, results.alert_count);

            // Finding standard deviation of alert values
            const lastYearStartDate = moment(begin).subtract('1', 'y');
            const lastYearEndDate = moment(end).subtract('1', 'y');
            const lastYearAlerts = await GLADAlertsService.getAnalysisInPeriodForSubscription(
                lastYearStartDate.format('YYYY-MM-DD'),
                lastYearEndDate.format('YYYY-MM-DD'),
                subscription.params
            );

            const lastYearAverage = _.mean(lastYearAlerts.map((al) => al.alert__count));
            const lastYearStdDev = EmailHelpersService.standardDeviation(lastYearAlerts.map((al) => al.alert__count));
            const currentAvg = _.mean(allAlerts.map((al) => al.alert__count));

            const twoPlusStdDev = currentAvg >= lastYearAverage + (2 * lastYearStdDev);
            const plusStdDev = (currentAvg > lastYearAverage) && (currentAvg < lastYearAverage + lastYearStdDev);
            const minusStdDev = (currentAvg < lastYearAverage) && (currentAvg < lastYearAverage + lastYearStdDev);
            const twoMinusStdDev = currentAvg <= lastYearAverage - (2 * lastYearStdDev);

            // Calc normality string
            let status = 'average';
            if (twoPlusStdDev) {
                status = 'unusually high';
            } else if (plusStdDev) {
                status = 'high';
            } else if (minusStdDev) {
                status = 'low';
            } else if (twoMinusStdDev) {
                status = 'unusually high';
            }

            results.glad_frequency = EmailHelpersService.translateFrequency(status, subscription.language);
        } catch (err) {
            logger.error(err);
            results.alerts = [];
        }
        logger.info('Glad P Results ', results);
        return results;
    }

}

module.exports = MonthlySummaryPresenter;
