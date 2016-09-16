'use strict';

var config = require('config');
var logger = require('logger');
var sleep = require('co-sleep');
var AsyncClient = require('vizz.async-client');

var SubscriptionService = require('services/subscriptionService');
var MessageProcessor = require('services/messageProcessor');

const CHANNEL = 'subscription_alerts';
const ALERT_POST_CHANNEL = 'subscription_alerts_publish';

class AlertQueue {
  constructor() {
    logger.debug('Initializing queue with provider %s ', `redis://${config.get('redisLocal.host')}:${config.get('redisLocal.port')}`);
    this.asynClient = new AsyncClient(AsyncClient.REDIS, {
      url: `redis://${config.get('redisLocal.host')}:${config.get('redisLocal.port')}`
    });


    var channel = this.asynClient.toChannel(CHANNEL);
    channel.on('message', this.processMessage.bind(this));
    channel.subscribe();
  }

  *
  processMessage(channel, message) {
    logger.info('Processing alert');
    let layerSlug = MessageProcessor.getLayerSlug(message),
      begin = MessageProcessor.getBeginDate(message),
      end = MessageProcessor.getEndDate(message);

    logger.debug('Params in message', layerSlug, begin, end);
    let subscriptions = yield SubscriptionService.getSubscriptionsByLayer(
      layerSlug);
    logger.debug('Subscriptions obtained', subscriptions);

    logger.info('Sending alerts for', layerSlug, begin.toISOString(), end.toISOString());
    try {
      let channel = this.asynClient.toChannel(ALERT_POST_CHANNEL);

      // for (let i = 0, length = subscriptions.length; i < length; i++) {
      //     if( i % 10 === 0) {
      //       yield sleep(20000);
      //     }
      //     let config = {
      //       layer_slug: layerSlug,
      //       subscription_id: subscriptions[i]._id,
      //       begin: begin,
      //       end: end
      //     };
      //     channel.emit(JSON.stringify(config));
      // }

    } catch (e) {
      logger.error(e);
    }
  }
}


module.exports = new AlertQueue();
