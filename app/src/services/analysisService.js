'use strict';

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

  static * execute(layerSlug, begin, end) {
    let period = formatDate(begin) + ',' + formatDate(end);

    let result = yield microserviceClient.requestToMicroservice({
      uri: '/' + layerSlug,
      method: 'GET',
      json: true,
      qs: {period: period}
    });

    if (result.statusCode !== 200) {
      console.error('Error obtaining layer:');
      console.error(result.body);
      return null;
    }

    return yield deserializer(result.body);
  }

}

module.export = AnalysisService;
