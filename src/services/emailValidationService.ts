import logger from 'logger';
import moment, { Moment } from 'moment';
import Subscription, { ISubscription } from 'models/subscription';
import SlackService from 'services/slackService';
import SparkpostService from 'services/sparkpostService';
import taskConfig, { Cron } from 'config/cron';
import { AlertType, EMAIL_MAP, EmailMap, EmailTemplates } from 'types/email.type';
import config from 'config';

export interface EmailValidationResult {
    success: boolean
    expectedSubscriptionEmailsSent: number
    sparkPostAPICalls: number
}

const SUCCESS_RANGE: number = 0.05;

class EmailValidationService {

    static getBeginAndEndDatesForCron(cron: string, date: Moment): { beginDate: Date, endDate: Date } {
        const task: Cron = taskConfig.find((t: Cron) => t.dataset === cron);

        const beginDate: Date = date.clone()
            .subtract(task.gap.value, task.gap.measure)
            .subtract(task.periodicity.value, task.periodicity.measure)
            .toDate();

        const endDate: Date = date.clone()
            .subtract(task.gap.value, task.gap.measure)
            .toDate();

        return { beginDate, endDate };
    }

    static async findExpectedEmailsForSubType(date: Moment, type: AlertType | 'default', cron: string): Promise<number> {
        let expectedNumberOfEmails: number = 0;
        const subscriptions: ISubscription[] = await Subscription.find({
            datasets: { $in: new RegExp(type) },
            'resource.type': 'EMAIL',
            confirmed: true,
        });
        const { beginDate, endDate } = EmailValidationService.getBeginAndEndDatesForCron(cron, date);

        for (const sub of subscriptions) {
            try {
                const res: boolean = await sub.publish(
                    { name: type, slug: type },
                    beginDate,
                    endDate,
                    false
                );

                if (res === true) expectedNumberOfEmails++;
            } catch (err) {
                // Suppress errors
                logger.error(err);
            }
        }

        return expectedNumberOfEmails;
    }

    static async getEmailsValidationObject(date: Moment, emailType: AlertType): Promise<EmailValidationResult> {
        const emailMap: EmailMap = EMAIL_MAP[emailType];

        const expected: number = await EmailValidationService.findExpectedEmailsForSubType(date, emailType, emailType);
        const sparkpostCount: number = await SparkpostService.requestMetricsForTemplate(date, new RegExp(emailMap.emailTemplate, 'g'));

        const expectedUpperLimit: number = expected + (SUCCESS_RANGE * expected);
        const expectedLowerLimit: number = expected - (SUCCESS_RANGE * expected);
        return {
            success: sparkpostCount >= expectedLowerLimit && sparkpostCount <= expectedUpperLimit,
            expectedSubscriptionEmailsSent: expected,
            sparkPostAPICalls: sparkpostCount,
        };
    }

    static async getEmailValidationResult(date: Moment, emailType: AlertType | 'default', emailTemplate: string): Promise<Partial<EmailValidationResult>> {

        const cron: string = ['glad-alerts', 'glad-all', 'glad-l', 'glad-s2', 'glad-radd'].includes(emailType) ? 'glad-alerts' : emailType;
        const sparkpostCount: number = await SparkpostService.requestMetricsForTemplate(date, new RegExp(emailTemplate, 'g'));
        let expected: number;

        if (emailType === 'monthly-summary' && date.date() !== 1) {
            // Monthly summary only runs on the first day of each month, so all other days we expect 0 emails
            expected = 0
        } else {
            expected = await EmailValidationService.findExpectedEmailsForSubType(date, emailType, cron);
        }

        return {
            expectedSubscriptionEmailsSent: expected,
            sparkPostAPICalls: sparkpostCount,
        };
    }

    static async validateSubscriptionEmailCount(date: Moment = moment()): Promise<void> {
        logger.info(`[SubscriptionValidation] Starting validation process for subscriptions for date ${date.toISOString()}`);

        const results: Partial<Record<EmailTemplates, Partial<EmailValidationResult>>> = {};

        await Promise.all(Object.keys(EMAIL_MAP).map(async (emailType: AlertType | 'default') => {
            if (emailType === 'default') {
                return;
            }

            const emailTemplate: EmailTemplates = EMAIL_MAP[emailType].emailTemplate;
            const templateResult: Partial<EmailValidationResult> = await EmailValidationService.getEmailValidationResult(date, emailType, emailTemplate)

            if (results[emailTemplate]) {
                results[emailTemplate].expectedSubscriptionEmailsSent = results[emailTemplate].expectedSubscriptionEmailsSent + templateResult.expectedSubscriptionEmailsSent
            } else {
                results[emailTemplate] = templateResult;
            }
        }));

        for (const emailTemplate in results) {
            const result: Partial<EmailValidationResult> = results[emailTemplate as EmailTemplates];
            const expectedUpperLimit: number = result.expectedSubscriptionEmailsSent + (SUCCESS_RANGE * result.expectedSubscriptionEmailsSent);
            const expectedLowerLimit: number = result.expectedSubscriptionEmailsSent - (SUCCESS_RANGE * result.expectedSubscriptionEmailsSent);
            results[emailTemplate as EmailTemplates] = {
                success: result.sparkPostAPICalls >= expectedLowerLimit && result.sparkPostAPICalls <= expectedUpperLimit,
                expectedSubscriptionEmailsSent: result.expectedSubscriptionEmailsSent,
                sparkPostAPICalls: result.sparkPostAPICalls,
            };
        }

        logger.info(`[SubscriptionValidation] Ended validation process. results: ${JSON.stringify(results)}`);

        const success: boolean = typeof (Object.values(results).find((result: EmailValidationResult) => result.success === false)) === 'undefined';

        if (config.get('slack.enabled') === 'true' || config.get('slack.enabled') === true) {
            if (success) {
                logger.info(`[SubscriptionValidation] Validation process was successful for ${date.toISOString()}, triggering success action`);
                await SlackService.subscriptionsValidationSuccessMessage(date.toDate(), results as Record<EmailTemplates, EmailValidationResult>);
            } else {
                logger.info(`[SubscriptionValidation] Validation process was NOT successful for ${date.toISOString()}, triggering failure action`);
                await SlackService.subscriptionsValidationFailureMessage(date.toDate(), results as Record<EmailTemplates, EmailValidationResult>);
            }
        }
    }

}

export default EmailValidationService;
