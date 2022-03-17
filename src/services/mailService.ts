import config from 'config';
import logger from 'logger';
import { createClient, RedisClientType } from '@node-redis/client';
import { PublisherData } from 'publishers/publisher.interface';
import SparkPost from 'sparkpost';

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

    sendMail(template: string, data: PublisherData, recipients: SparkPost.Recipient[], sender: string = 'gfw'): void {
        this.redisClient.publish(CHANNEL, JSON.stringify({
            template,
            data,
            recipients,
            sender
        }));
    }

    sendDatasetEmail(template: string, data: DatasetEmail, recipients: SparkPost.Recipient[], sender: string = 'gfw'): void {
        this.redisClient.publish(CHANNEL, JSON.stringify({
            template,
            data,
            recipients,
            sender
        }));
    }

    sendSubscriptionConfirmationEmail(template: string, data: SubscriptionConfirmationEmail, recipients: SparkPost.Recipient[], sender: string = 'gfw'): void {
        this.redisClient.publish(CHANNEL, JSON.stringify({
            template,
            data,
            recipients,
            sender
        }));
    }

}

export default new MailService();
