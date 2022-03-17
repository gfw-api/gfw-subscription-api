import logger from 'logger';
import mailService from 'services/mailService';
import { ISubscription } from 'models/subscription';
import { ILayer } from 'models/layer';
import { PublisherData, PublisherInterface } from 'publishers/publisher.interface';
import SparkPost from 'sparkpost';

const DEFAULT_TEMPLATE: string = 'forest-change-notification';

const TEMPLATE_MAP: Record<string, string> = {
    'viirs-active-fires': 'forest-fires-notification-viirs',
    'glad-alerts': 'glad-updated-notification',
    'monthly-summary': 'monthly-summary',
    'glad-all': 'glad-updated-notification',
    'glad-l': 'glad-updated-notification',
    'glad-s2': 'glad-updated-notification',
    'glad-radd': 'glad-updated-notification',
};

class EmailPublisher implements PublisherInterface {

    async publish(subscription: ISubscription, results: PublisherData, layer: ILayer): Promise<void> {
        logger.info('[SubscriptionEmails] Publishing email with results', results);
        let template: string = TEMPLATE_MAP[layer.slug] || DEFAULT_TEMPLATE;
        const language: string = subscription.language.toLowerCase().replace(/_/g, '-');
        template = `${template}-${language}`;
        logger.info('[SubscriptionEmails] MAIL TEMPLATE', template);
        const recipients: SparkPost.Recipient[] = [{
            address: subscription.resource.content
        }];
        mailService.sendMail(template, results, recipients);
    }

}

export default new EmailPublisher();
