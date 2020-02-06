const logger = require('logger');
const AnalysisClassifier = require('services/analysisClassifier');

const ctRegisterMicroservice = require('ct-register-microservice-node');
const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;

const moment = require('moment');

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

        const path = AnalysisClassifier.pathFor(subscription, layerSlug);
        const url = `/${layerSlug}${path}`;
        logger.debug('subscription id: ', subscription._id, 'Url ', url, 'and query ', query);
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri: url,
                method: 'GET',
                json: true,
                qs: query
            });
            return await new JSONAPIDeserializer({
                keyForAttribute: 'camelCase'
            }).deserialize(result);
        } catch (e) {
            logger.error(e);
            return null;
        }
    }

}

module.exports = AnalysisService;
