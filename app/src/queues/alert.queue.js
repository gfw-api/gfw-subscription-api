const config = require('config');
const logger = require('logger');
const redis = require('redis');

const SubscriptionService = require('services/subscriptionService');
const DatasetService = require('services/datasetService');
const MessageProcessor = require('services/messageProcessor');

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

            for (let i = 0, { length } = subscriptions; i < length; i++) {
                try {
                    await subscriptions[i].publish({ name: layerSlug, slug: layerSlug }, begin, end);
                } catch (e) {
                    logger.error(`[SubscriptionEmailsError] Error processing subscription with ID ${subscriptions[i]._id}`);
                    logger.error(`[SubscriptionEmailsError] ${e}`);
                }
            }

        } catch (e) {
            logger.error(e);
        }
    }

}

module.exports = AlertQueue;
