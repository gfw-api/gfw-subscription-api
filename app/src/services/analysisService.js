const logger = require('logger');
const AnalysisClassifier = require('services/analysisClassifier');
const coRequest = require('co-request');

const ctRegisterMicroservice = require('ct-register-microservice-node');
const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
const deserializer = function (obj) {
    return function (callback) {
        new JSONAPIDeserializer({ keyForAttribute: 'camelCase' }).deserialize(obj, callback);
    };
};

const moment = require('moment');
const formatDate = function (date) {
    return moment(date).format('YYYY-MM-DD');
};

class AnalysisService {

    static* execute(subscription, layerSlug, begin, end, forSubscription) {

        logger.info('Executing analysis for', layerSlug, begin, end);

        let period = formatDate(begin) + ',' + formatDate(end),
            query = { period };

        if (subscription.params.geostore) {
            query.geostore = subscription.params.geostore;
        }
        if (forSubscription) {
            query.forSubscription = true;
        }

        let path = AnalysisClassifier.pathFor(subscription, layerSlug),
            url = '/' + layerSlug + path;
        logger.debug('subscription id: ', subscription._id, 'Url ', url, 'and query ', query);
        try {
            let result = yield ctRegisterMicroservice.requestToMicroservice({
                uri: url,
                method: 'GET',
                json: true,
                qs: query
            });
            return yield deserializer(result);
        } catch (e) {
            logger.error(e);
            return null;
        }
    }

}

module.exports = AnalysisService;
