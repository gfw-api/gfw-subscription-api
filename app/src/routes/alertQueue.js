'use strict';

var config = require('config');
var logger = require('logger');
var AsyncClient = require('async-client');

var SubscriptionService = require('services/subscriptionService');
var MessageProcessor = require('services/messageProcessor');

const CHANNEL = 'subscription_alerts';
const ALERT_POST_CHANNEL = 'subscription_alerts_publish';

class AlertQueue {
  constructor() {
    logger.debug('Initializing queue with provider %s ', config.get('apiGateway.queueProvider'));
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
    let layerSlug = MessageProcessor.getLayerSlug(message),
        begin = MessageProcessor.getBeginDate(message),
        end   = MessageProcessor.getEndDate(message);

    let subscriptions = yield SubscriptionService.getSubscriptionsByLayer(
      layerSlug);

    try {
      logger.info('Sending alerts for', layerSlug, begin.toISOString(), end.toISOString());

      let channel = this.asynClient.toChannel(ALERT_POST_CHANNEL);
      subscriptions.forEach(function(subscription) {
        let config = {
          layer_slug: layerSlug,
          subscription_id: subscription._id,
          begin: begin,
          end: end
        };

        channel.emit(JSON.stringify(config));
      });
    } catch (e) {
      logger.error('Error sending subscription mail', e);
    }
  }
}

module.exports = new AlertQueue();
