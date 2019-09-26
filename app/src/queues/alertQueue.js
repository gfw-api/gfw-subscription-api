const config = require('config');
const logger = require('logger');
const redis = require("redis");

const SubscriptionService = require('services/subscriptionService');
const DatasetService = require('services/datasetService');
const MessageProcessor = require('services/messageProcessor');
const EmailPublisher = require('publishers/emailPublisher');

const STATS_MAILS = config.get('mails.statsRecipients').split(',');
const CHANNEL = config.get('apiGateway.subscriptionAlertsChannelName');

class AlertQueue {
    constructor() {
        logger.info('[AlertQueue] Initializing AlertQueue listener');
        logger.debug('[AlertQueue] Initializing queue with provider %s ', config.get('redis.url'));

        const redisClient = redis.createClient({ url: config.get('redis.url') });
        redisClient.subscribe(CHANNEL);

        redisClient.on('message', this.processMessage.bind(this));
        // redisClient.on('message', (channel, message) => {
        //     console.log("sub channel " + channel + ": " + message);
        // });

        logger.info('[AlertQueue] AlertQueue listener initialized');
    }

    * processMessage(channel, message) {
        logger.info('[AlertQueue] Processing alert message');
        logger.debug(`[AlertQueue] Processing alert message: ${message}`);

        if (JSON.parse(message).layer_slug === 'dataset') {
            yield DatasetService.processSubscriptions();
            return;
        }

        let layerSlug = MessageProcessor.getLayerSlug(message),
            begin = MessageProcessor.getBeginDate(message),
            end = MessageProcessor.getEndDate(message);

        logger.debug('[AlertQueue] Params in message', layerSlug, begin, end);
        let subscriptions = yield SubscriptionService.getSubscriptionsByLayer(
            layerSlug);
        logger.debug('[AlertQueue] Subscriptions obtained', subscriptions);
        logger.info('[AlertQueue] Sending alerts for', layerSlug, begin.toISOString(), end.toISOString());
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
