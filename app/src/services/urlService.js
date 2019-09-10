'use strict';

var config = require('config');
const BASE_URL = config.get('apiGateway.externalUrl');
const logger = require('logger');

class UrlService {

    static flagshipUrl(path) {
        if (!path) {
            path = '';
        }
        return config.get('gfw.flagshipUrl') + path;
    }

    static flagshipUrlRW(path, env = 'production') {
        if (!path) {
            path = '';
        }
        logger.info('config', config.get('rw.flagshipUrl'));

        if (!['production', 'staging', 'preproduction'].includes(env)) {
            logger.warn(`invalid env requested: ${env}. Overriding with staging`);

            env = 'staging';
        }

        return config.get(`rw.flagshipUrl.${env}`) + path;
    }

    static confirmationUrl(subscription) {
        return BASE_URL + '/subscriptions/' + subscription._id + '/confirm?application=' + subscription.application;
    }

    static unsubscribeUrl(subscription) {
        return BASE_URL + '/subscriptions/' + subscription._id + '/unsubscribe?redirect=true';
    }

}

module.exports = UrlService;
