import config from 'config';
import logger from 'logger';
import { createClient, RedisClientType } from 'redis';

import SubscriptionService from 'services/subscriptionService';
import DatasetService from 'services/datasetService';
import { ISubscription } from 'models/subscription';

const CHANNEL: string = config.get('apiGateway.subscriptionAlertsChannelName');

class AlertQueue {

    constructor() {
        logger.info('[AlertQueue] Initializing AlertQueue listener');
        logger.debug('[AlertQueue] Initializing queue with provider %s ', config.get('redis.url'));

        const redisClient: RedisClientType = createClient({ url: config.get('redis.url') });
        redisClient.subscribe(CHANNEL, AlertQueue.processMessage);

        logger.info('[AlertQueue] AlertQueue listener initialized');
    }

    static async processMessage(message: string): Promise<void> {
        logger.info('[AlertQueue] Processing alert message');
        logger.debug(`[AlertQueue] Processing alert message: ${message}`);

        const parsedMessage: Record<string, any> = JSON.parse(message);

        if (parsedMessage.layer_slug === 'dataset') {
            await DatasetService.processSubscriptions();
            return;
        }

        const layerSlug: string = parsedMessage.layer_slug;
        const begin: Date = new Date(Date.parse(parsedMessage.begin_date));
        const end: Date = new Date(Date.parse(parsedMessage.end_date));

        logger.debug('[AlertQueue] Params in message', layerSlug, begin, end);
        const subscriptions: ISubscription[] = await SubscriptionService.getSubscriptionsByLayer(
            layerSlug === 'glad-alerts' ? ['glad-alerts', 'glad-all', 'glad-l', 'glad-s2', 'glad-radd'] : [layerSlug]
        );
        logger.debug('[AlertQueue] Subscriptions obtained', subscriptions);
        logger.info('[AlertQueue] Sending alerts for', layerSlug, begin.toISOString(), end.toISOString());
        try {
            // Code for testing subscription emails
            const email: string = parsedMessage.email;
            const subId: string = parsedMessage.subId;
            if (email && subId) {
                const subscription: ISubscription = await SubscriptionService.getSubscriptionById(subId);
                subscription.resource.type = 'EMAIL';
                subscription.resource.content = email;
                subscription.language = parsedMessage.language || 'en';
                const layer: { slug: string, name: string } = { name: layerSlug, slug: layerSlug };
                await subscription.publish(layer, begin, end, !!email);
                return;
            }

            // The real code that handles daily emails
            for (let i: number = 0, { length } = subscriptions; i < length; i++) {
                try {
                    let name: string = layerSlug;
                    if (layerSlug === 'glad-alerts') {
                        [name] = subscriptions[i].datasets.filter((el: string) => el.startsWith('glad-'));
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

export default AlertQueue;
