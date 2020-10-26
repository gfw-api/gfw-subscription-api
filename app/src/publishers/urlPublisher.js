const logger = require('logger');
const request = require('request-promise-native');

class UrlPublisher {

    static async publish(subscription, results) {
        logger.info('Publishing webhook with results', results, '. Doing request POST to ', subscription.resource.content);
        try {
            await request({
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
