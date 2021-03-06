const logger = require('logger');
const moment = require('moment');
const { RWAPIMicroservice } = require('rw-api-microservice-node');

const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;

const AnalysisClassifier = require('services/analysisClassifier');
const GLADAlertsService = require('services/gladAlertsService');
const ViirsAlertsService = require('services/viirsAlertsService');

const formatDate = (date) => moment(date).format('YYYY-MM-DD');

class AnalysisService {

    static async execute(subscription, layerSlug, begin, end, forSubscription) {

        logger.info('Executing analysis for', layerSlug, begin, end);

        const period = `${formatDate(begin)},${formatDate(end)}`;
        const query = { period };

        if (subscription.params.geostore) {
            query.geostore = subscription.params.geostore;
        }
        if (forSubscription) {
            query.forSubscription = true;
        }

        const path = AnalysisClassifier.pathFor(subscription);
        const url = `/${layerSlug}${path}`;
        logger.debug('subscription id: ', subscription._id, 'Url ', url, 'and query ', query);
        try {
            // Override results in the case of glad-alerts
            if (layerSlug === 'glad-alerts') {
                return await GLADAlertsService.getAnalysisInPeriodForSubscription(formatDate(begin), formatDate(end), subscription.params);
            }

            // Override results in the case of viirs-active-fires
            if (layerSlug === 'viirs-active-fires') {
                return await ViirsAlertsService.getAnalysisInPeriodForSubscription(formatDate(begin), formatDate(end), subscription.params);
            }

            // Override results in the case of monthly-summary
            if (layerSlug === 'monthly-summary') {
                const gladAlerts = await GLADAlertsService.getAnalysisInPeriodForSubscription(formatDate(begin), formatDate(end), subscription.params);
                const viirsAlerts = await ViirsAlertsService.getAnalysisInPeriodForSubscription(formatDate(begin), formatDate(end), subscription.params);
                return { gladAlerts, viirsAlerts };
            }

            const result = await RWAPIMicroservice.requestToMicroservice({
                uri: url,
                method: 'GET',
                json: true,
                qs: query
            });

            return await new JSONAPIDeserializer({ keyForAttribute: 'camelCase' }).deserialize(result);
        } catch (e) {
            logger.error(e);
            return null;
        }
    }

}

module.exports = AnalysisService;
