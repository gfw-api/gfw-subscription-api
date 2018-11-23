'use strict';
var logger = require('logger');
var AnalysisClassifier = require('services/analysisClassifier');

const ctRegisterMicroservice = require('ct-register-microservice-node');
var JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
var deserializer = function (obj) {
    return function (callback) {
        new JSONAPIDeserializer({ keyForAttribute: 'camelCase' }).deserialize(obj, callback);
    };
};

var moment = require('moment');
var formatDate = function (date) {
    return moment(date).format('YYYY-MM-DD');
};

class AnalysisService {

    static* execute(subscription, layerSlug, begin, end, forSubscription) {

        logger.info('Executing analysis for', layerSlug, begin, end);

        let period = formatDate(begin) + ',' + formatDate(end),
            query = { period: period };

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
