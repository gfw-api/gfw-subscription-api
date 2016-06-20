'use strict';

var microserviceClient = require('microservice-client');
var JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;

var deserializer = function(obj) {
    return function(callback) {
        new JSONAPIDeserializer({}).deserialize(obj, callback);
    };
};

class Layer {

  static * findBySlug(slug) {
    let result = yield microserviceClient.requestToMicroservice({
      uri: '/layers/' + slug,
      method: 'GET',
      json: true
    });

    if (result.statusCode !== 200) {
      console.error('Error obtaining layer:');
      console.error(result.body);
      return null;
    }

    return yield deserializer(result.body);
  }

}

module.exports = Layer;
