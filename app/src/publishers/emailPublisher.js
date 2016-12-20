'use strict';
var logger = require('logger');
var mailService = require('services/mailService');

const DEFAULT_TEMPLATE = 'forest-change-notification';
const TEMPLATE_MAP = {
  'viirs-active-fires': 'fires-notification',
  'imazon-alerts': 'forest-change-imazon-alerts',
  'story': 'stories-alerts'
};

class EmailPublisher {

  static publish(subscription, results, layer) {
      logger.info('Publishing email with results', results);
    let template = TEMPLATE_MAP[layer.slug] || DEFAULT_TEMPLATE;
    let language = subscription.language.toLowerCase().replace(/_/g, '-');
    template = `${template}-${language}`;
    logger.info('MAIL TEMPLATE', template);
    let recipients = [{
          address: {
            email: subscription.resource.content
          }
        }];
    mailService.sendMail(template, results, recipients);
  }

  static sendStats(emails, stats) {
    logger.info('Publishing email with stats', stats);
    let template = 'subscriptions-stats';
    logger.info('MAIL TEMPLATE', template);
    let recipients = emails.map(el => ({address: {email: el}}));
    mailService.sendMail(template, stats, recipients);
  }

}

module.exports = EmailPublisher;
