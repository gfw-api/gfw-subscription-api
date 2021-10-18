const logger = require('logger');
const moment = require('moment');
const EmailHelpersService = require('services/emailHelpersService');
const GLADPresenter = require('presenters/gladPresenter');
const GladS2Service = require('services/gfw-data-api/gladS2Service');

class GLADS2Presenter {

    static async transform(results, layer, subscription, begin, end) {
        try {
            const resultObject = GLADPresenter.buildResultObject(results, layer, subscription, begin, end);

            resultObject.downloadUrls = await GladS2Service.getDownloadURLs(
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

            resultObject.glad_alert_type = EmailHelpersService.translateAlertType('glad-s2', subscription.language);

            logger.info('GLAD-S2 Results ', resultObject);
            return resultObject;
        } catch (err) {
            logger.error(err);
            results.alerts = [];
            throw err;
        }

    }

}

module.exports = GLADS2Presenter;
