import config from 'config';
import axios, { AxiosRequestConfig } from 'axios';
import { EmailValidationResult } from 'services/emailValidationService';
import { EmailTemplates } from 'types/email.type';

class SlackService {

    static async sendMessage(channel: string, text: string): Promise<void> {
        const requestConfig: AxiosRequestConfig = {
            method: 'POST',
            baseURL: 'https://slack.com/api',
            url: `/chat.postMessage`,
            headers: {
                'authorization': `Bearer ${config.get('slack.apiKey')}`
            },
            data: { channel, text },
        };

        await axios(requestConfig);
    }

    static processResults(results: Record<EmailTemplates, EmailValidationResult>): string[] {
        return Object.keys(results).map((key: EmailTemplates) => {
            const result: EmailValidationResult = results[key];
            let line: string = '';
            switch (key) {
                case 'glad-updated-notification':
                    line = `GLAD alerts`;
                    break;
                case 'forest-fires-notification-viirs':
                    line = `VIIRS alerts`;
                    break;
                case 'monthly-summary':
                    line = `Monthly summary alerts`;
                    break;
                default:
                    break;
            }

            line = `${line} - expected ${result.expectedSubscriptionEmailsSent} emails (+-5%), got ${result.sparkPostAPICalls} calls to the Sparkpost API: ${result.success ? ':heavy_check_mark:' : ':x:'}`;

            return line;
        })
    }

    static async subscriptionsValidationSuccessMessage(date: Date, results: Record<EmailTemplates, EmailValidationResult>): Promise<void> {
        const lines: string[] = SlackService.processResults(results)

        const message: string = `*[${date.toString()}] [${process.env.NODE_ENV}] Subscription validation process PASSED :heavy_check_mark:*

${lines.join('\n')}
`;
        await SlackService.sendMessage(config.get('slack.channel'), message);
    }

    static async subscriptionsValidationFailureMessage(date: Date, results: Record<EmailTemplates, EmailValidationResult>): Promise<void> {
        const lines: string[] = SlackService.processResults(results)

        const message: string = `*[${date.toString()}] [${process.env.NODE_ENV}] Subscription validation process FAILED :x:*

${lines.join('\n')}
`;

        await SlackService.sendMessage(config.get('slack.channel'), message);
    }

}

export default SlackService;
