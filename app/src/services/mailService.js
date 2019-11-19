const config = require('config');
const logger = require('logger');
const redis = require('redis');

const CHANNEL = config.get('apiGateway.queueName');

class MailService {

    constructor() {
        logger.debug('[MailService] Initializing mail queue');

        this.redisClient = redis.createClient({
            url: config.get('redis.url')
        });
    }

    sendMail(template, data, recipients, sender = 'gfw') {
        this.redisClient.publish(CHANNEL, JSON.stringify({
            template,
            data,
            recipients,
            sender
        }));
    }

}

module.exports = new MailService();
