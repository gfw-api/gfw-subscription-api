'use strict';

var AnalysisClassifier = require('services/analysisClassifier');

var microserviceClient = require('microservice-client');
var JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
var deserializer = function(obj) {
    return function(callback) {
        new JSONAPIDeserializer({}).deserialize(obj, callback);
    };
};

var moment = require('moment');
var formatDate = function(date) {
  return moment(date).format('YYYY-MM-DD');
};

class AnalysisService {

  static * execute(subscription, layerSlug, begin, end) {
    console.log('Executing analysis for', layerSlug, begin, end);

    let period = formatDate(begin) + ',' + formatDate(end),
        query = { period: period };

    if (subscription.geostoreId) {
      query.geostore = subscription.geostoreId;
    }

    let path = AnalysisClassifier.pathFor(subscription),
        url = '/' + layerSlug + path;

    console.log('URL', url);
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
