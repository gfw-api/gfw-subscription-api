const config = require('config');
const logger = require('logger');
const redis = require("redis");
const CHANNEL = config.get('apiGateway.queueName');

class MailService {
    constructor() {
        logger.debug('[MailService] Initializing mail queue');

        this.redisClient = redis.createClient({
            url: `redis://${config.get('redisLocal.host')}:${config.get('redisLocal.port')}`
        });
    }

    sendMail(template, data, recipients, sender = 'gfw') {
        this.redisClient.publish(CHANNEL, JSON.stringify({
            template: template,
            data: data,
            recipients,
            sender
        }));
    }
}

module.exports = new MailService();
