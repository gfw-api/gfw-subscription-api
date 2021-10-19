const logger = require('logger');
const moment = require('moment');
const EmailHelpersService = require('services/emailHelpersService');
const GladAllPresenter = require('presenters/gladAllPresenter');
const GladS2Service = require('services/gfw-data-api/gladS2Service');

class GLADS2Presenter {

    static async transform(results, layer, subscription, begin, end) {
        try {
            const resultObject = GladAllPresenter.buildResultObject(results, layer, subscription, begin, end);

            resultObject.downloadUrls = await GladS2Service.getDownloadURLs(
                moment(begin).format('YYYY-MM-DD'),
                moment(end).format('YYYY-MM-DD'),
                subscription.params
            );

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
