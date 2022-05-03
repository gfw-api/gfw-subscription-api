const logger = require('logger');
const request = require('request-promise-native');

class UrlPublisher {

    static async publish(subscription, results) {
        try {
            await request({
                uri: subscription.resource.content,
                method: 'POST',
                body: results,
                json: true
            });
            logger.info(`[SubscriptionWebhooks] POSTed to webhook successfully with URL ${subscription.resource.content}`);
        } catch (e) {
            logger.error(`[SubscriptionWebhooksError] Error doing POST to URL ${subscription.resource.content}: ${JSON.stringify(e)}`);
        }

    }

}

module.exports = UrlPublisher;
