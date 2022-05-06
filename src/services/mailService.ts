import config from 'config';
import logger from 'logger';
import { createClient, RedisClientType } from 'redis';
import SparkPost from 'sparkpost';
import { EmailLanguageType, EmailTemplates, SubscriptionEmailData } from 'types/email.type';

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

    sendMail(template: EmailTemplates, language: EmailLanguageType, data: SubscriptionEmailData, recipients: SparkPost.Recipient[], sender: string = 'gfw'): void {
        const fullTemplate: string = `${template}-${language}`
        this.redisClient.publish(CHANNEL, JSON.stringify({
            template: fullTemplate,
            data,
            recipients,
            sender
        }));
    }

    sendDatasetEmail(env: string, data: DatasetEmail, recipients: SparkPost.Recipient[], sender: string = 'gfw'): void {
        let template: string = 'dataset-rw';
        if (env && env !== 'production') {
            template += `-${env}`;
        }
        this.redisClient.publish(CHANNEL, JSON.stringify({
            template,
            data,
            recipients,
            sender
        }));
    }

    sendSubscriptionConfirmationEmail(language: EmailLanguageType, application: string, data: SubscriptionConfirmationEmail, recipients: SparkPost.Recipient[], sender: string = 'gfw'): void {
        let template: string = `subscription-confirmation-${language}`;
        if (application !== 'gfw') {
            template = `subscription-confirmation-${application}-${language}`;
        }
        this.redisClient.publish(CHANNEL, JSON.stringify({
            template,
            data,
            recipients,
            sender
        }));
    }

}

export default new MailService();
