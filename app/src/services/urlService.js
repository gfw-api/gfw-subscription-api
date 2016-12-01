'use strict';

var config = require('config');
const BASE_URL = config.get('apiGateway.externalUrl');

class UrlService {

  static flagshipUrl(path) {
    if (!path) { path = ''; }
    return config.get('gfw.flagshipUrl') + path;
  }

  static confirmationUrl(subscription) {
      return BASE_URL + '/subscriptions/' + subscription._id + '/confirm';
  }

  static unsubscribeUrl(subscription) {
      return BASE_URL + '/subscriptions/' + subscription._id + '/unsubscribe?redirect=true';
  }

}

module.exports = UrlService;
