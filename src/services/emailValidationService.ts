import logger from 'logger';
import moment, { Moment } from 'moment';
import Subscription, { ISubscription } from 'models/subscription';
import SlackService from 'services/slackService';
import SparkpostService from 'services/sparkpostService';
import taskConfig, { Cron } from 'config/cron';
import { AlertType, EMAIL_MAP, EmailMap } from 'types/email.type';

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

    static async findExpectedEmailsForSubType(date: Moment, type: AlertType): Promise<number> {
        let expectedNumberOfEmails: number = 0;
        const subscriptions: ISubscription[] = await Subscription.find({
            datasets: { $in: new RegExp(type) },
            'resource.type': 'EMAIL',
            confirmed: true,
        });
        const { beginDate, endDate } = EmailValidationService.getBeginAndEndDatesForCron(type, date);

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

        const expected: number = await EmailValidationService.findExpectedEmailsForSubType(date, emailType);
        const sparkpostCount: number = await SparkpostService.requestMetricsForTemplate(date, new RegExp(`/${emailMap.emailTemplate}/g`));

        const expectedUpperLimit: number = expected + (SUCCESS_RANGE * expected);
        const expectedLowerLimit: number = expected - (SUCCESS_RANGE * expected);
        return {
            success: sparkpostCount >= expectedLowerLimit && sparkpostCount <= expectedUpperLimit,
            expectedSubscriptionEmailsSent: expected,
            sparkPostAPICalls: sparkpostCount,
        };
    }

    static async validateSubscriptionEmailCount(date: Moment = moment()): Promise<{ date: Moment, glad: EmailValidationResult, viirs: EmailValidationResult, monthly: EmailValidationResult }> {
        logger.info(`[SubscriptionValidation] Starting validation process for subscriptions for date ${date.toISOString()}`);

        // There is an issue with GLAD emails, as the same template is used for multiple subscription types
        // @todo this should be fixed by aggregating all subscriptions sharing the common sparkpost template
        const glad: EmailValidationResult = await EmailValidationService.getEmailsValidationObject(date, 'glad-alerts');

        const viirs: EmailValidationResult = await EmailValidationService.getEmailsValidationObject(date, 'viirs-active-fires');
        logger.info(`[SubscriptionValidation] Ended validation process.`);
        logger.info(`[SubscriptionValidation] GLAD: ${JSON.stringify(glad)}`);
        logger.info(`[SubscriptionValidation] VIIRS: ${JSON.stringify(viirs)}`);

        let monthly: EmailValidationResult
        if (date.date() === 1) {
            monthly = await EmailValidationService.getEmailsValidationObject(date, 'monthly-summary');
            logger.info(`[SubscriptionValidation] Monthly: ${JSON.stringify(monthly)}`);
        } else {
            monthly = {
                success: true,
                expectedSubscriptionEmailsSent: 0,
                sparkPostAPICalls: 0,
            };
        }

        if (process.env.NODE_ENV === 'prod') {
            if (glad.success && viirs.success && monthly.success) {
                logger.info(`[SubscriptionValidation] Validation process was successful for ${date.toISOString()}, triggering success action`);
                await SlackService.subscriptionsValidationSuccessMessage(date.toDate(), glad, viirs, monthly);
            } else {
                logger.info(`[SubscriptionValidation] Validation process was NOT successful for ${date.toISOString()}, triggering failure action`);
                await SlackService.subscriptionsValidationFailureMessage(date.toDate(), glad, viirs, monthly);
            }
        }

        return {
            date,
            glad,
            viirs,
            monthly,
        };
    }

}

export default EmailValidationService;
