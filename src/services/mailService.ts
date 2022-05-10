import config from 'config';
import logger from 'logger';
import { createClient, RedisClientType } from 'redis';
import SparkPost from 'sparkpost';
import { EmailLanguageType, EmailTemplates, SubscriptionEmailDataType } from 'types/email.type';

const CHANNEL: string = config.get('apiGateway.queueName');

export type SubscriptionConfirmationEmail = {
    confirmation_url: string
}

export type DatasetEmail = {
    alertBeginDate: string
    alertEndDate: string
    alertName: string
    alertResult: string
    alertType: string
    areaId: string
    areaName: string
    datasetName: string
    datasetSummary: string
    datasetId?: string
    subject?: string
};

class MailService {

    redisClient: RedisClientType

    constructor() {
        logger.debug('[MailService] Initializing mail queue');

        this.redisClient = createClient({
            url: config.get('redis.url')
        });
        this.redisClient.connect();
    }

    sendMail(template: EmailTemplates, language: EmailLanguageType, data: SubscriptionEmailDataType, recipients: SparkPost.Recipient[], sender: string = 'gfw'): Promise<number> {
        const fullTemplate: string = `${template}-${language}`
        const message: string = JSON.stringify({
            template: fullTemplate,
            data,
            recipients,
            sender
        })
        logger.debug('[sendMail] - Sending mail with data', message);

        return this.redisClient.publish(CHANNEL, message);
    }

    sendDatasetEmail(env: string, data: DatasetEmail, recipients: SparkPost.Recipient[], sender: string = 'gfw'): Promise<number> {
        let template: string = 'dataset-rw';
        if (env && env !== 'production') {
            template += `-${env}`;
        }
        const message: string = JSON.stringify({
            template,
            data,
            recipients,
            sender
        })
        logger.debug('[sendDatasetEmail] - Sending mail with data', message);
        return this.redisClient.publish(CHANNEL, message);
    }

    sendSubscriptionConfirmationEmail(language: EmailLanguageType, application: string, data: SubscriptionConfirmationEmail, recipients: SparkPost.Recipient[], sender: string = 'gfw'): Promise<number> {
        let template: string = `subscription-confirmation-${language}`;
        if (application !== 'gfw') {
            template = `subscription-confirmation-${application}-${language}`;
        }
        const message: string = JSON.stringify({
            template,
            data,
            recipients,
            sender
        })
        logger.debug('[sendSubscriptionConfirmationEmail] - Sending mail with data', message);
        return this.redisClient.publish(CHANNEL, message);
    }

}

export default new MailService();
