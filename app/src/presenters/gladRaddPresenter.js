const logger = require('logger');
const moment = require('moment');
const EmailHelpersService = require('services/emailHelpersService');
const GLADPresenter = require('presenters/gladPresenter');
const GladRaddService = require('services/gfw-data-api/gladRaddService');

class GLADRaddPresenter {

    static async transform(results, layer, subscription, begin, end) {
        try {
            const resultObject = GLADPresenter.buildResultObject(results, layer, subscription, begin, end);

            resultObject.downloadUrls = await GladRaddService.getDownloadURLs(
                moment(begin).format('YYYY-MM-DD'),
                moment(end).format('YYYY-MM-DD'),
                subscription.params
            );

            const lastYearAlerts = await GladRaddService.getAlertsSamePeriodLastYearForSubscription(begin, end, subscription.params);
            resultObject.glad_frequency = await EmailHelpersService.calculateAlertFrequency(results.data, lastYearAlerts, subscription.language);

            logger.info('GLAD-RADD Results ', resultObject);
            return resultObject;
        } catch (err) {
            logger.error(err);
            results.alerts = [];
            throw err;
        }

    }

}

module.exports = GLADRaddPresenter;
