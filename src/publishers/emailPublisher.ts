import logger from 'logger';
import mailService from 'services/mailService';
import { ISubscription } from 'models/subscription';
import { ILayer } from 'models/layer';
import { PublisherInterface } from 'publishers/publisher.interface';
import SparkPost from 'sparkpost';
import { EMAIL_MAP, EmailLanguageType, EmailMap, EmailTemplates, SubscriptionEmailData } from 'types/email.type';

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
