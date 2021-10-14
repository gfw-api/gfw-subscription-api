const logger = require('logger');
const moment = require('moment');
const EmailHelpersService = require('services/emailHelpersService');
const GLADPresenter = require('presenters/gladPresenter');
const GladAllService = require('services/gfw-data-api/gladAllService');

class GLADAllPresenter {

    static async transform(results, layer, subscription, begin, end) {
        try {
            const resultObject = GLADPresenter.buildResultObject(results, layer, subscription, begin, end);

            resultObject.downloadUrls = await GladAllService.getDownloadURLs(
                moment(begin).format('YYYY-MM-DD'),
                moment(end).format('YYYY-MM-DD'),
                subscription.params
            );

            const lastYearAlerts = await GladAllService.getAlertsSamePeriodLastYearForSubscription(begin, end, subscription.params);
            resultObject.glad_frequency = await EmailHelpersService.calculateAlertFrequency(results.data, lastYearAlerts, subscription.language);

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
