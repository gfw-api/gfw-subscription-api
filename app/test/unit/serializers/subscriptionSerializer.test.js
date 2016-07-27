'use strict';
var logger = require('logger');
var should = require('should');
var assert = require('assert');
var SubscriptionSerializer = require('serializers/subscriptionSerializer');

describe('Subscription serializer test', function() {
  var story = {
    name: 'An area I want to subscribe to',
    createdAt: '2016-04-12T15:41:38.000Z',
    updatedAt: '2016-04-12T15:41:38.125Z',
    userId: 'aaaa',
    geostoreId: 'aaaa',
    resource: {
      type: 'EMAIL',
      content: 'adam.mulligan@vizzuality.com'
    },
    datasets: ['layer_slug']
  };

  it('Generate correct jsonapi response of the story', function() {
    let response = SubscriptionSerializer.serialize(story);
    response.should.not.be.a.Array();
    response.should.have.property('data');

    let data = response.data;
    data.should.have.property('type');
    data.should.have.property('attributes');
    data.type.should.equal('subscription');
    data.attributes.should.have.property('name');
    data.attributes.should.have.property('createdAt');
    data.attributes.should.have.property('updatedAt');
    data.attributes.should.have.property('resource');
    data.attributes.should.have.property('userId');
    data.attributes.should.have.property('geostoreId');
    data.attributes.should.have.property('datasets');
  });
});
