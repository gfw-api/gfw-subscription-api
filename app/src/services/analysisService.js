'use strict';
var logger = require('logger');
var AnalysisClassifier = require('services/analysisClassifier');

var microserviceClient = require('microservice-client');
var JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
var deserializer = function(obj) {
    return function(callback) {
        new JSONAPIDeserializer({keyForAttribute: 'camelCase'}).deserialize(obj, callback);
    };
};

var moment = require('moment');
var formatDate = function(date) {
  return moment(date).format('YYYY-MM-DD');
};

class AnalysisService {

  static * execute(subscription, layerSlug, begin, end, forSubscription) {

    logger.info('Executing analysis for', layerSlug, begin, end);

    let period = formatDate(begin) + ',' + formatDate(end),
        query = { period: period };

    if (subscription.params.geostore) {
      query.geostore = subscription.params.geostore;
    }
    if(forSubscription) {
        query.forSubscription = true;
    }

    let path = AnalysisClassifier.pathFor(subscription),
        url = '/' + layerSlug + path;

    let result = yield microserviceClient.requestToMicroservice({
          uri: url,
          method: 'GET',
          json: true,
          qs: query
        });

    if (result.statusCode !== 200) {
      console.error('Error calculating analysis:');
      console.error(result.body);
      return null;
    }

    return yield deserializer(result.body);
  }

}

module.exports = AnalysisService;
