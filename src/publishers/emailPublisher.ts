import logger from 'logger';
import mailService from 'services/mailService';
import { ISubscription } from 'models/subscription';
import { ILayer } from 'models/layer';
import SparkPost from 'sparkpost';
import { EMAIL_MAP, EmailLanguageType, EmailMap, EmailTemplates, SubscriptionEmailDataType } from 'types/email.type';
import { PublisherInterface } from 'publishers/publisher.interface';

class EmailPublisher implements PublisherInterface {

    async publish(subscription: ISubscription, results: SubscriptionEmailDataType, layer: ILayer): Promise<number> {
        logger.info('[SubscriptionEmails] Publishing email with results', results);
        const emailMap: EmailMap = EMAIL_MAP[layer.slug] || EMAIL_MAP['default'];
        const template: EmailTemplates = emailMap.emailTemplate;
        const language: EmailLanguageType = subscription.language.toLowerCase().replace(/_/g, '-') as EmailLanguageType;
        logger.info('[SubscriptionEmails] MAIL TEMPLATE', template);
        const recipients: SparkPost.Recipient[] = [{
            address: subscription.resource.content
        }];
        return mailService.sendMail(template, language, results, recipients);
    }

}

export default new EmailPublisher();
