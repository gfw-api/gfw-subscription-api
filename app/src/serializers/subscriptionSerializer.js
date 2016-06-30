'use strict';

var logger = require('logger');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

var subscriptionSerializer = new JSONAPISerializer('subscription', {
  attributes: [
    'name', 'createdAt', 'updatedAt', 'userId', 'geostoreId',
    'resource', 'layers', 'params'
  ],

  resource: {
    attributes: ['type', 'content']
  },

  layers: {
    attributes: ['name', 'params']
  },

  params: {
    attributes: ['iso', 'id1', 'wdpa_id', 'use']
  },

  typeForAttribute: function (attribute) { return attribute; },
  keyForAttribute: 'camelCase'
});

class SubscriptionSerializer {
  static serialize(data) {
    return subscriptionSerializer.serialize(data);
  }
}

module.exports = SubscriptionSerializer;
