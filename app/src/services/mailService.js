const config = require('config');
const logger = require('logger');
const AsyncClient = require('vizz.async-client');
const CHANNEL = config.get('apiGateway.queueName');

class MailService {
    constructor() {
        logger.debug('Initializing queue with provider %s ', config.get('apiGateway.queueProvider'));
        switch (config.get('apiGateway.queueProvider').toLowerCase()) {
            case AsyncClient.REDIS:
                this.asyncClient = new AsyncClient(AsyncClient.REDIS, {
                    url: config.get('apiGateway.queueUrl')
                });
                break;
            default:
        }
        this.asyncClient = this.asyncClient.toChannel(CHANNEL);
    }

    sendMail(template, data, recipients, sender = 'gfw') {
        this.asyncClient.emit(JSON.stringify({
            template: template,
            data: data,
            recipients,
            sender
        }));
    }
}

module.exports = new MailService();
