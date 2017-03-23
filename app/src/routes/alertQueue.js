'use strict';

var config = require('config');
var logger = require('logger');
var sleep = require('co-sleep');
var AsyncClient = require('vizz.async-client');

var SubscriptionService = require('services/subscriptionService');
var MessageProcessor = require('services/messageProcessor');
var EmailPublisher = require('publishers/emailPublisher');

const STATS_MAILS = config.get('mails.statsRecipients').split(',');
const CHANNEL = 'subscription_alerts';

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
        let mailCounter = 0;
        let mails = [];
        for (let i = 0, length = subscriptions.length; i < length; i++) {
            try {
              let subscription = yield SubscriptionService.getSubscriptionById(
                    subscriptions[i]._id);
              let layer = {name: layerSlug, slug: layerSlug};
              let sent = yield subscription.publish(layer, begin, end);
              if(sent){
                  mailCounter++;
                  mails.push(subscription.resource.content);
              }
            } catch(e) {
              logger.error(e);
            }
        }
        EmailPublisher.sendStats(STATS_MAILS, {counter: mailCounter, mails: mails, dataset: layerSlug});
    } catch (e) {
      logger.error(e);
    }
  }

}


module.exports = new AlertQueue();
