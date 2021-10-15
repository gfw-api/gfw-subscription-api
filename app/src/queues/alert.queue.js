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
        const subscriptions = await SubscriptionService.getSubscriptionsByLayer(
            layerSlug === 'glad-alerts' ? ['glad-alerts', 'glad-all', 'glad-l', 'glad-s2', 'glad-radd'] : [layerSlug]
        );
        logger.debug('[AlertQueue] Subscriptions obtained', subscriptions);
        logger.info('[AlertQueue] Sending alerts for', layerSlug, begin.toISOString(), end.toISOString());
        try {
            // Code for testing subscription emails
            const email = MessageProcessor.getEmail(message);
            const subId = MessageProcessor.getSubscriptionId(message);
            if (email && subId) {
                const subscription = await SubscriptionService.getSubscriptionById(subId);
                subscription.resource.type = 'EMAIL';
                subscription.resource.content = email;
                subscription.language = MessageProcessor.getLanguage(message);
                const layer = { name: layerSlug, slug: layerSlug };
                await subscription.publish(layer, begin, end, email);
                return;
            }

            // The real code that handles daily emails
            for (let i = 0, { length } = subscriptions; i < length; i++) {
                try {
                    let name = layerSlug;
                    if (layerSlug === 'glad-alerts') {
                        [name] = subscriptions[i].datasets.filter((el) => el.startsWith('glad-'));
                    }

                    await subscriptions[i].publish({ name, slug: name }, begin, end);
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
