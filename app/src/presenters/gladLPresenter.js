const logger = require('logger');
const moment = require('moment');
const EmailHelpersService = require('services/emailHelpersService');
const GLADPresenter = require('presenters/gladPresenter');
const GladLService = require('services/gfw-data-api/gladLService');

class GLADLPresenter {

    static async transform(results, layer, subscription, begin, end) {
        try {
            const resultObject = GLADPresenter.buildResultObject(results, layer, subscription, begin, end);

            resultObject.downloadUrls = await GladLService.getDownloadURLs(
                moment(begin).format('YYYY-MM-DD'),
                moment(end).format('YYYY-MM-DD'),
                subscription.params
            );

            const lastYearAlerts = await GladLService.getAlertsSamePeriodLastYearForSubscription(begin, end, subscription.params);
            resultObject.glad_frequency = await EmailHelpersService.calculateAlertFrequency(results.data, lastYearAlerts, subscription.language);

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
