const logger = require('logger');
const mailService = require('services/mailService');

const DEFAULT_TEMPLATE = 'forest-change-notification';
const TEMPLATE_MAP = {
    'viirs-active-fires': 'forest-fires-notification-viirs',
    'glad-alerts': 'forest-change-notification-glads',
    'monthly-summary': 'monthly-summary',
    'glad-all': 'glad-updated-notification',
    'glad-l': 'glad-updated-notification',
    'glad-s2': 'glad-updated-notification',
    'glad-radd': 'glad-updated-notification',
};

class EmailPublisher {

    static async publish(subscription, results, layer) {
        logger.info('[SubscriptionEmails] Publishing email with results', results);
        let template = TEMPLATE_MAP[layer.slug] || DEFAULT_TEMPLATE;
        const language = subscription.language.toLowerCase().replace(/_/g, '-');
        template = `${template}-${language}`;
        logger.info('[SubscriptionEmails] MAIL TEMPLATE', template);
        const recipients = [{
            address: {
                email: subscription.resource.content
            }
        }];
        mailService.sendMail(template, results, recipients);
    }

}

module.exports = EmailPublisher;
