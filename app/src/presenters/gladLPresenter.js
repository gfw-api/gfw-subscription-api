const logger = require('logger');
const moment = require('moment');
const EmailHelpersService = require('services/emailHelpersService');
const GladAllPresenter = require('presenters/gladAllPresenter');
const GladLService = require('services/gfw-data-api/gladLService');

class GLADLPresenter {

    static async transform(results, layer, subscription, begin, end) {
        try {
            const resultObject = GladAllPresenter.buildResultObject(results, layer, subscription, begin, end);

            resultObject.downloadUrls = await GladLService.getDownloadURLs(
                moment(begin).format('YYYY-MM-DD'),
                moment(end).format('YYYY-MM-DD'),
                subscription.params
            );

            resultObject.glad_alert_type = EmailHelpersService.translateAlertType('glad-l', subscription.language);

            logger.info('GLAD-L Results ', resultObject);
            return resultObject;
        } catch (err) {
            logger.error(err);
            results.alerts = [];
            throw err;
        }

    }

}

module.exports = GLADLPresenter;
