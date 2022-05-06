import logger from 'logger';
import axios, { AxiosRequestConfig } from 'axios';
import { ISubscription } from 'models/subscription';
import { PublisherData, PublisherInterface } from 'publishers/publisher.interface';

class UrlPublisher implements PublisherInterface {

    async publish(subscription: ISubscription, results: PublisherData): Promise<void> {
        try {
            const requestConfig: AxiosRequestConfig = {
                method: 'POST',
                url: subscription.resource.content,
                data: results
            };

            await axios(requestConfig);

            logger.info(`[SubscriptionWebhooks] POSTed to webhook successfully with URL ${subscription.resource.content}`);
        } catch (e) {
            logger.error(`[SubscriptionWebhooksError] Error doing POST to URL ${subscription.resource.content}`);
        }

    }

}

export default new UrlPublisher();
