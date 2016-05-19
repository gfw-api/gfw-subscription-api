'use strict';

var logger = require('logger');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

var subscriptionSerializer = new JSONAPISerializer('subscription', {
  attributes: [
    'name', 'createdAt', 'updatedAt', 'userId', 'geostoreId',
    'resource', 'layers'
  ],

  resource: {
    attributes: ['type', 'content']
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
