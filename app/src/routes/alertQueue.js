'use strict';

var config = require('config');
var logger = require('logger');
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

  static sendPack(subscriptions, i) {

    let channel = this.asynClient.toChannel(ALERT_POST_CHANNEL);
    setTimeout(function() {
      logger.info(`Sending pack of ${i*10} to ${(i*10)+10}`);
      for (let j = i * 10; j < ((i * 10) + 10); j++) {
        let config = {
          layer_slug: layerSlug,
          subscription_id: subscription._id,
          begin: begin,
          end: end
        };

        channel.emit(JSON.stringify(config));
      }
      AlertQueue.sendPack(subscriptions, i++);
    }, 60000);
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
      try {
        logger.info('Sending alerts for', layerSlug, begin.toISOString(), end.toISOString());

        AlertQueue.sendPack(subscriptions);

      }

      module.exports = new AlertQueue();
