'use strict';

var config = require('config');
var logger = require('logger');
var AsyncClient = require('vizz.async-client');
var _ = require('lodash');

var SubscriptionService = require('services/subscriptionService');

const CHANNEL = 'subscription_alerts_publish';

class AlertPublishQueue {
    constructor() {
        logger.debug('Initializing publisher queue with provider %s ', `redis://${config.get('redisLocal.host')}:${config.get('redisLocal.port')}`);

        this.asynClient = new AsyncClient(AsyncClient.REDIS, {
            url: `redis://${config.get('redisLocal.host')}:${config.get('redisLocal.port')}`
        });


        var channel = this.asynClient.toChannel(CHANNEL);
        channel.on('message', this.processMessage.bind(this));
        channel.subscribe();
    }

    *
    processMessage(channel, message) {
        logger.info('Processing message in %s', CHANNEL, ' with data ', message);
        let config = JSON.parse(message),
            layerSlug = config.layer_slug,
            subscription = yield SubscriptionService.getSubscriptionById(
                config.subscription_id),
            //layer = _.find(subscription.datasets, {name: layerSlug});
            layer = {
                name: config.layer_slug,
                slug: config.layer_slug
            };
        yield subscription.publish(layer, config.begin, config.end);
    }
}

module.exports = new AlertPublishQueue();
