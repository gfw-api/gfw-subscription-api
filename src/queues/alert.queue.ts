import config from 'config';
import logger from 'logger';
import { createClient, RedisClientType } from 'redis';

import SubscriptionService from 'services/subscriptionService';
import DatasetService from 'services/datasetService';
import { ALERT_TYPES, ISubscription } from 'models/subscription';
import { EmailLanguageType } from 'types/email.type';

const CHANNEL: string = config.get('apiGateway.subscriptionAlertsChannelName');

export type AlertQueueMessage = {
    layer_slug: string,
    begin_date?: string,
    end_date?: string,
    email?: string,
    url?: string,
    type?: ALERT_TYPES,
    subId?: string,
    isTest?: boolean,
    language?: EmailLanguageType
};

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

        const parsedMessage: AlertQueueMessage = JSON.parse(message);

        if (parsedMessage.layer_slug === 'dataset') {
            await DatasetService.processSubscriptions();
            return;
        }

        const layerSlug: string = parsedMessage.layer_slug;
        const begin: Date = new Date(Date.parse(parsedMessage.begin_date));
        const end: Date = new Date(Date.parse(parsedMessage.end_date));

        logger.debug('[AlertQueue] Params in message', layerSlug, begin, end);

        if (parsedMessage.isTest === true) {
            const subscription: ISubscription = await SubscriptionService.getSubscriptionById(parsedMessage.subId);
            if (!subscription) {
                logger.error(`Could not find subscription with id ${parsedMessage.subId}`);
            }

            const type: ALERT_TYPES = parsedMessage.type ? parsedMessage.type : subscription.resource.type;
            subscription.resource.type = type;

            switch (type) {
                case 'EMAIL':
                    subscription.resource.content = parsedMessage.email ? parsedMessage.email : subscription.resource.content;
                    break;

                case 'URL':
                    subscription.resource.content = parsedMessage.url ? parsedMessage.url : subscription.resource.content;
                    break;
            }

            subscription.language = parsedMessage.language || 'en';
            const layer: { slug: string, name: string } = { name: layerSlug, slug: layerSlug };
            await subscription.publish(layer, begin, end);
            return;
        } else {
            const subscriptions: ISubscription[] = await SubscriptionService.getSubscriptionsByLayer(
                layerSlug === 'glad-alerts' ? ['glad-alerts', 'glad-all', 'glad-l', 'glad-s2', 'glad-radd'] : [layerSlug]
            );
            logger.debug('[AlertQueue] Subscriptions obtained', subscriptions);
            logger.info('[AlertQueue] Sending alerts for', layerSlug, begin.toISOString(), end.toISOString());

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
        }
    }

}

export default AlertQueue;
