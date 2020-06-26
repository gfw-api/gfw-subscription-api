/* eslint-disable max-len */
const _ = require('lodash');
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

            results.alerts = alerts.map((el) => ({
                alert_type: 'GLAD',
                date: `${moment(el.alert__date).format('DD/MM/YYYY HH:MM')} UTC`,
            }));
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

            // Calculate alerts grouped by area types
            let intactForestAlerts = 0;
            let primaryForestAlerts = 0;
            let peatAlerts = 0;
            let protectedAreasAlerts = 0;
            let plantationAlerts = 0;

            const useValueOrAlertCount = (val, count) => (Number.isInteger(val) ? Number.parseInt(val, 10) : count);

            alerts.forEach((al) => {
                if (al.is__ifl_intact_forest_landscape_2016) {
                    intactForestAlerts += useValueOrAlertCount(al.is__ifl_intact_forest_landscape_2016, al.alert__count);
                }

                if (al.is__umd_regional_primary_forest_2001) {
                    primaryForestAlerts += useValueOrAlertCount(al.is__umd_regional_primary_forest_2001, al.alert__count);
                }

                if (al.is__peatland) {
                    peatAlerts += useValueOrAlertCount(al.is__peatland, al.alert__count);
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
            const currentAvg = _.mean(alerts.map((al) => al.alert__count));

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

module.exports = GLADPresenter;
