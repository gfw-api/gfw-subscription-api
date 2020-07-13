const logger = require('logger');
const mailService = require('services/mailService');

const DEFAULT_TEMPLATE = 'forest-change-notification';
const TEMPLATE_MAP = {
    'viirs-active-fires': 'forest-fires-notification-viirs',
    'imazon-alerts': 'forest-change-imazon-alerts',
    story: 'stories-alerts',
    'forma-alerts': 'forest-change-notification',
    forma250GFW: 'forest-change-notification',
    'terrai-alerts': 'forest-change-notification',
    'glad-alerts': 'forest-change-notification-glads',
    'monthly-summary': 'monthly-summary-notification',
};

class EmailPublisher {

    static async publish(subscription, results, layer) {
        logger.info('Publishing email with results', results);
        let template = TEMPLATE_MAP[layer.slug] || DEFAULT_TEMPLATE;
        const language = subscription.language.toLowerCase().replace(/_/g, '-');
        template = `${template}-${language}`;
        logger.info('MAIL TEMPLATE', template);
        const recipients = [{
            address: {
                email: subscription.resource.content
            }
        }];
        mailService.sendMail(template, results, recipients);
    }

    static sendStats(emails, stats) {
        logger.info('Publishing email with stats', stats);
        const template = 'subscriptions-stats';
        logger.info('MAIL TEMPLATE', template);
        const recipients = emails.map((el) => ({ address: { email: el } }));
        mailService.sendMail(template, stats, recipients);
    }

}

module.exports = EmailPublisher;
