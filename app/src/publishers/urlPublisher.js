var logger = require('logger');
const coRequest = require('co-request');


class UrlPublisher {

    static* publish(subscription, results, layer) {
        logger.info('Publishing webhook with results', results, '. Doing request POST to ', subscription.resource.content);
        try {
            yield coRequest({
                uri: subscription.resource.content,
                method: 'POST',
                body: results,
                json: true
            });
        } catch (e) {
            logger.error('Error doing POST to ', subscription.resource.content);
        }

    }

}

module.exports = UrlPublisher;
