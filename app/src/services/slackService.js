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
        const message = `*[${date.toLocaleString()}] Subscription validation process PASSED :heavy_check_mark:*

GLAD alerts - ${glad.sparkPostAPICalls} emails sent today.
VIIRS alerts - ${viirs.sparkPostAPICalls} emails sent today.
Monthly summary alerts - ${monthly.sparkPostAPICalls} emails sent today.
`;
        await SlackService.sendMessage(config.get('slack.channel'), message);
    }

    static async subscriptionsValidationFailureMessage(date, glad, viirs, monthly) {
        const message = `*[${date.toLocaleString()}] Subscription validation process FAILED :x:*

GLAD alerts: expected ${glad.expectedSubscriptionEmailsSent} emails, got ${glad.sparkPostAPICalls} calls to the Sparkpost API.
VIIRS alerts: expected ${viirs.expectedSubscriptionEmailsSent} emails, got ${viirs.sparkPostAPICalls} calls to the Sparkpost API.
Monthly summary alerts: expected ${monthly.expectedSubscriptionEmailsSent} emails, got ${monthly.sparkPostAPICalls} calls to the Sparkpost API.
`;

        await SlackService.sendMessage(config.get('slack.channel'), message);
    }

}

module.exports = SlackService;
