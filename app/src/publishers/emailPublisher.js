'use strict';

var mailService = require('services/mailService');

const DEFAULT_TEMPLATE = 'new-forest-change-notification';
const TEMPLATE_MAP = {
  'viirs-active-fires': 'new-fires-notification'
};

class EmailPublisher {

  static publish(subscription, results, layer) {
    let template = TEMPLATE_MAP[layer.slug] || DEFAULT_TEMPLATE,
        recipients = [{
          address: {
            email: subscription.resource.content
          }
        }];

    mailService.sendMail(template, results, recipients);
  }

}

module.exports = EmailPublisher;
