const logger = require('logger');
const moment = require('moment');
const EmailHelpersService = require('services/emailHelpersService');
const GladAllService = require('services/gfw-data-api/gladAllService');
const AlertUrlService = require('services/alertUrlService');
const UrlService = require('services/urlService');

class GLADAllPresenter {

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
            const resultObject = GLADAllPresenter.buildResultObject(results, layer, subscription, begin, end);

            resultObject.downloadUrls = await GladAllService.getDownloadURLs(
                moment(begin).format('YYYY-MM-DD'),
                moment(end).format('YYYY-MM-DD'),
                subscription.params
            );

            const sumArea = results.data.reduce((acc, curr) => acc + curr.alert_area__ha, 0);
            resultObject.area_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(sumArea, 2));

            const intactForestAlerts = results.data.filter((al) => !!al.is__ifl_intact_forest_landscape_2016);
            const intactForestSumArea = intactForestAlerts.reduce((acc, curr) => acc + curr.alert_area__ha, 0);
            resultObject.intact_forest_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(intactForestSumArea, 2));

            const primaryForestAlerts = results.data.filter((al) => !!al.is__umd_regional_primary_forest_2001);
            const primaryForestSumArea = primaryForestAlerts.reduce((acc, curr) => acc + curr.alert_area__ha, 0);
            resultObject.primary_forest_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(primaryForestSumArea, 2));

            const peatLandAlerts = results.data.filter((al) => !!al.is__peatland);
            const peatLandSumArea = peatLandAlerts.reduce((acc, curr) => acc + curr.alert_area__ha, 0);
            resultObject.peat_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(peatLandSumArea, 2));

            const wdpaAlerts = results.data.filter((al) => !!al.wdpa_protected_area__iucn_cat);
            const wdpaSumArea = wdpaAlerts.reduce((acc, curr) => acc + curr.alert_area__ha, 0);
            resultObject.wdpa_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(wdpaSumArea, 2));

            resultObject.glad_alert_type = EmailHelpersService.translateAlertType('glad-all', subscription.language);

            logger.info('GLAD-ALL Results ', resultObject);
            return resultObject;
        } catch (err) {
            logger.error(err);
            results.alerts = [];
            throw err;
        }

    }

}

module.exports = GLADAllPresenter;
