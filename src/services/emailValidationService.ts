import logger from 'logger';
import moment, { Moment } from 'moment';
import Subscription, { ISubscription } from 'models/subscription';
import SlackService from 'services/slackService';
import SparkpostService from 'services/sparkpostService';
import taskConfig, { Cron } from 'config/cron';

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

    static async findExpectedEmailsForSubType(date: Moment, type: string): Promise<number> {
        let expectedNumberOfEmails: number = 0;
        const subscriptions: ISubscription[] = await Subscription.find({
            datasets: new RegExp(type),
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

    static async getGLADEmailsValidationObject(date: Moment): Promise<EmailValidationResult> {
        const gladExpected: number = await EmailValidationService.findExpectedEmailsForSubType(date, 'glad-alerts');
        const gladSparkpostCount: number = await SparkpostService.getGLADCountInjectedOnDate(date);

        const expectedUpperLimit: number = gladExpected + (SUCCESS_RANGE * gladExpected);
        const expectedLowerLimit: number = gladExpected - (SUCCESS_RANGE * gladExpected);
        return {
            success: gladSparkpostCount >= expectedLowerLimit && gladSparkpostCount <= expectedUpperLimit,
            expectedSubscriptionEmailsSent: gladExpected,
            sparkPostAPICalls: gladSparkpostCount,
        };
    }

    static async getVIIRSEmailsValidationObject(date: Moment): Promise<EmailValidationResult> {
        const viirsExpected: number = await EmailValidationService.findExpectedEmailsForSubType(date, 'viirs-active-fires');
        const viirsSparkpostCount: number = await SparkpostService.getVIIRSCountInjectedOnDate(date);

        const expectedUpperLimit: number = viirsExpected + (SUCCESS_RANGE * viirsExpected);
        const expectedLowerLimit: number = viirsExpected - (SUCCESS_RANGE * viirsExpected);
        return {
            success: viirsSparkpostCount >= expectedLowerLimit && viirsSparkpostCount <= expectedUpperLimit,
            expectedSubscriptionEmailsSent: viirsExpected,
            sparkPostAPICalls: viirsSparkpostCount,
        };
    }

    static async getMonthlyEmailsValidationObject(date: Moment): Promise<EmailValidationResult> {
        if (date.date() === 1) {
            const monthlyExpected: number = await EmailValidationService.findExpectedEmailsForSubType(date, 'monthly-summary');
            const monthlySparkpostCount: number = await SparkpostService.getMonthlyCountInjectedOnDate(date);

            const expectedUpperLimit: number = monthlyExpected + (SUCCESS_RANGE * monthlyExpected);
            const expectedLowerLimit: number = monthlyExpected - (SUCCESS_RANGE * monthlyExpected);
            return {
                success: monthlySparkpostCount >= expectedLowerLimit && monthlySparkpostCount <= expectedUpperLimit,
                expectedSubscriptionEmailsSent: monthlyExpected,
                sparkPostAPICalls: monthlySparkpostCount,
            };
        }

        return {
            success: true,
            expectedSubscriptionEmailsSent: 0,
            sparkPostAPICalls: 0,
        };
    }

    static async validateSubscriptionEmailCount(date: Moment = moment()): Promise<{ date: Moment, glad: EmailValidationResult, viirs: EmailValidationResult, monthly: EmailValidationResult }> {
        logger.info(`[SubscriptionValidation] Starting validation process for subscriptions for date ${date.toISOString()}`);

        const glad: EmailValidationResult = await EmailValidationService.getGLADEmailsValidationObject(date);
        const viirs: EmailValidationResult = await EmailValidationService.getVIIRSEmailsValidationObject(date);
        const monthly: EmailValidationResult = await EmailValidationService.getMonthlyEmailsValidationObject(date);

        logger.info(`[SubscriptionValidation] Ended validation process.`);
        logger.info(`[SubscriptionValidation] GLAD: ${JSON.stringify(glad)}`);
        logger.info(`[SubscriptionValidation] VIIRS: ${JSON.stringify(viirs)}`);
        logger.info(`[SubscriptionValidation] Monthly: ${JSON.stringify(monthly)}`);

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
