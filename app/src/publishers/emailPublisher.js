'use strict';
var logger = require('logger');
var mailService = require('services/mailService');

const DEFAULT_TEMPLATE = 'forest-change-notification';
const TEMPLATE_MAP = {
  'viirs-active-fires': 'fires-notification'
};

class EmailPublisher {

  static publish(subscription, results, layer) {
      logger.info('Publishing email with results', results);
    let template = TEMPLATE_MAP[layer.slug] || DEFAULT_TEMPLATE;
    template = `${template}-${subscription.language}`;
    let recipients = [{
          address: {
            email: subscription.resource.content
          }
        }];

    mailService.sendMail(template, results, recipients);
  }

}

module.exports = EmailPublisher;
