import logger from 'logger';
import mailService from 'services/mailService';
import { ISubscription } from 'models/subscription';
import { ILayer } from 'models/layer';
import SparkPost from 'sparkpost';
import { EMAIL_MAP, EmailLanguageType, EmailMap, EmailTemplates, SubscriptionEmailData } from 'types/email.type';
import { PublisherInterface } from 'publishers/publisher.interface';

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

    async publish(subscription: ISubscription, results: SubscriptionEmailData, layer: ILayer): Promise<void> {
        logger.info('[SubscriptionEmails] Publishing email with results', results);
        const emailMap: EmailMap = EMAIL_MAP[layer.slug] || EMAIL_MAP['default'];
        const template: EmailTemplates = emailMap.emailTemplate;
        const language: EmailLanguageType = subscription.language.toLowerCase().replace(/_/g, '-') as EmailLanguageType;
        logger.info('[SubscriptionEmails] MAIL TEMPLATE', template);
        const recipients: SparkPost.Recipient[] = [{
            address: subscription.resource.content
        }];
        mailService.sendMail(template, language, results, recipients);
    }

}

export default new EmailPublisher();
