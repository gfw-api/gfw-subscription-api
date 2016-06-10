'use strict';

var config = require('config');
var logger = require('logger');
var AsyncClient = require('async-client');

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
        subscription = yield SubscriptionService.getSubscriptionById(
          config.subscription_id);

    yield subscription.sendAlert(config.layer_slug);
  }
}

module.exports = new AlertPublishQueue();
