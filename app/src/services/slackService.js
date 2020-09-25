const config = require('config');
const request = require('request-promise-native');

class SlackService {

    static async sendMessage(channel, text) {
        await request({
            uri: `https://slack.com/api/chat.postMessage`,
            method: 'POST',
            body: { channel, text },
            json: true,
            headers: { Authorization: `Bearer ${config.get('slack.apiKey')}` },
        });
    }

    static async subscriptionsValidationSuccessMessage(date, glad, viirs, monthly) {
        const message = `*[${date.toString()}] [${process.env.NODE_ENV}] Subscription validation process PASSED :heavy_check_mark:*

GLAD alerts - ${glad.sparkPostAPICalls} emails sent today: :heavy_check_mark:
VIIRS alerts - ${viirs.sparkPostAPICalls} emails sent today: :heavy_check_mark:
Monthly summary alerts - ${monthly.sparkPostAPICalls} emails sent today: :heavy_check_mark:
`;
        await SlackService.sendMessage(config.get('slack.channel'), message);
    }

    static async subscriptionsValidationFailureMessage(date, glad, viirs, monthly) {
        const message = `*[${date.toString()}] [${process.env.NODE_ENV}] Subscription validation process FAILED :x:*

GLAD alerts - expected ${glad.expectedSubscriptionEmailsSent} emails (+-5%), got ${glad.sparkPostAPICalls} calls to the Sparkpost API: ${glad.success ? ':heavy_check_mark:' : ':x:'}
VIIRS alerts - expected ${viirs.expectedSubscriptionEmailsSent} emails (+-5%), got ${viirs.sparkPostAPICalls} calls to the Sparkpost API: ${viirs.success ? ':heavy_check_mark:' : ':x:'}
Monthly summary alerts - expected ${monthly.expectedSubscriptionEmailsSent} emails (+-5%), got ${monthly.sparkPostAPICalls} calls to the Sparkpost API: ${monthly.success ? ':heavy_check_mark:' : ':x:'}
`;

        await SlackService.sendMessage(config.get('slack.channel'), message);
    }

}

module.exports = SlackService;
