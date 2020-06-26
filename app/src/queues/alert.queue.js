const config = require('config');
const logger = require('logger');
const redis = require('redis');

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

        redisClient.on('message', AlertQueue.processMessage);

        logger.info('[AlertQueue] AlertQueue listener initialized');
    }

    static async processMessage(channel, message) {
        logger.info('[AlertQueue] Processing alert message');
        logger.debug(`[AlertQueue] Processing alert message: ${message}`);

        if (JSON.parse(message).layer_slug === 'dataset') {
            await DatasetService.processSubscriptions();
            return;
        }

        const layerSlug = MessageProcessor.getLayerSlug(message);
        const begin = MessageProcessor.getBeginDate(message);
        const end = MessageProcessor.getEndDate(message);

        logger.debug('[AlertQueue] Params in message', layerSlug, begin, end);
        const subscriptions = await SubscriptionService.getSubscriptionsByLayer(layerSlug);
        logger.debug('[AlertQueue] Subscriptions obtained', subscriptions);
        logger.info('[AlertQueue] Sending alerts for', layerSlug, begin.toISOString(), end.toISOString());
        try {
            const email = MessageProcessor.getEmail(message);
            const subId = MessageProcessor.getSubscriptionId(message);
            if (email && subId) {
                const subscription = await SubscriptionService.getSubscriptionById(subId);
                subscription.resource.type = 'EMAIL';
                subscription.resource.content = email;
                const layer = { name: layerSlug, slug: layerSlug };
                await subscription.publish(layer, begin, end, email);
                return;
            }

            let mailCounter = 0;
            const users = [];
            for (let i = 0, { length } = subscriptions; i < length; i++) {
                try {
                    const subscription = await SubscriptionService.getSubscriptionById(subscriptions[i]._id);
                    const layer = { name: layerSlug, slug: layerSlug };
                    const sent = await subscription.publish(layer, begin, end);
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

            EmailPublisher.sendStats(STATS_MAILS, { counter: mailCounter, users, dataset: layerSlug });
        } catch (e) {
            logger.error(e);
        }
    }

}


module.exports = AlertQueue;
