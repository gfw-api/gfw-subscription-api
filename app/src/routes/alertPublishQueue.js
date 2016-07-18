'use strict';

var config = require('config');
var logger = require('logger');
var AsyncClient = require('async-client');
var _ = require('lodash');

var SubscriptionService = require('services/subscriptionService');

const CHANNEL = 'subscription_alerts_publish';

class AlertPublishQueue {
  constructor() {
    logger.debug('Initializing publisher queue with provider %s ', config.get('apiGateway.queueProvider'));
    switch (config.get('apiGateway.queueProvider').toLowerCase()) {
      case AsyncClient.REDIS:
        this.asynClient = new AsyncClient(AsyncClient.REDIS, {
        url: config.get('apiGateway.queueUrl')
      });
      break;
      default:
    }

    var channel = this.asynClient.toChannel(CHANNEL);
    channel.on('message', this.processMessage.bind(this));
    channel.subscribe();
  }

  * processMessage(channel, message) {
    let config = JSON.parse(message),
        layerSlug = config.layer_slug,
        subscription = yield SubscriptionService.getSubscriptionById(
          config.subscription_id),
        layer = _.find(subscription.datasets, {name: layerSlug});

    yield subscription.publish(layer, config.begin, config.end);
  }
}

module.exports = new AlertPublishQueue();
