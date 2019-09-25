const config = require('config');
const logger = require('logger');
const AsyncClient = require('vizz.async-client');

const SubscriptionService = require('services/subscriptionService');
const DatasetService = require('services/datasetService');
const MessageProcessor = require('services/messageProcessor');
const EmailPublisher = require('publishers/emailPublisher');

const STATS_MAILS = config.get('mails.statsRecipients').split(',');
const CHANNEL = 'subscription_alerts';

class AlertQueue {
    constructor() {
        logger.info('Initializing AlertQueue listener');
        logger.debug('Initializing queue with provider %s ', `redis://${config.get('redisLocal.host')}:${config.get('redisLocal.port')}`);
        this.asyncClient = new AsyncClient(AsyncClient.REDIS, {
            url: `redis://${config.get('redisLocal.host')}:${config.get('redisLocal.port')}`
        });


        const channel = this.asyncClient.toChannel(CHANNEL);
        channel.on('message', this.processMessage.bind(this));
        channel.subscribe();
    }

    * processMessage(channel, message) {
        logger.info('Processing alert message');
        logger.debug(`Processing alert message: ${message}`);

        if (JSON.parse(message).layer_slug === 'dataset') {
            yield DatasetService.processSubscriptions();
            return;
        }

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
            let users = [];
            for (let i = 0, length = subscriptions.length; i < length; i++) {
                try {
                    let subscription = yield SubscriptionService.getSubscriptionById(subscriptions[i]._id);
                    let layer = { name: layerSlug, slug: layerSlug };
                    let sent = yield subscription.publish(layer, begin, end);
                    if (sent) {
                        mailCounter++;
                        users.push({
                            userId: subscription.userId,
                            email: subscription.resource.content,
                            subscriptionId: subscriptions[i]._id
                        });
                    }
                } catch (e) {
                    logger.error(e);
                }
            }

            EmailPublisher.sendStats(STATS_MAILS, { counter: mailCounter, users: users, dataset: layerSlug });
        } catch (e) {
            logger.error(e);
        }
    }

}


module.exports = new AlertQueue();
