'use strict';

var SubscriptionService = require('services/subscriptionService');

describe('subscriptionService', function() {

  describe('.createSubscription', function() {

    var requestData = {
      name: 'An area I want to subscribe to',
      loggedUser: {id: 'aaaa'},
      geostoreId: 'aaaa',
      resource: {
        type: 'EMAIL',
        content: 'adam.mulligan@vizzuality.com'
      },
      layers: ['layer_slug']
    };

    it('creates a subscription', function *() {
      //let response = yield SubscriptionService.createSubscription(requestData);
      //let data = response.data;

      //data.should.have.property('type');
      //data.should.have.property('attributes');
      //data.type.should.equal('subscription');
      //data.attributes.should.have.property('name');
      //data.attributes.should.have.property('createdAt');
      //data.attributes.should.have.property('updatedAt');
      //data.attributes.should.have.property('resource');
      //data.attributes.should.have.property('userId');
      //data.attributes.should.have.property('geostoreId');
      //data.attributes.should.have.property('layers');
    });

  });

  describe('.deleteSubscription', function() {
  });

  describe('.updateSubscription', function() {
  });

  describe('.getSubscriptionById', function() {
  });

  describe('.getSubscriptionsForUser', function() {
  });

});
