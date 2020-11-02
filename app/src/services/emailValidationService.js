/* eslint-disable no-restricted-syntax */
const logger = require('logger');
const moment = require('moment');

const Subscription = require('models/subscription');

const SlackService = require('services/slackService');
const SparkpostService = require('services/sparkpostService');

const taskConfig = require('../../../config/cron.json');

const SUCCESS_RANGE = 0.05;

class EmailValidationService {

    static getBeginAndEndDatesForCron(cron, date) {
        const task = taskConfig.find((t) => t.dataset === cron);

        const beginDate = date.clone()
            .subtract(task.gap.value, task.gap.measure)
            .subtract(task.periodicity.value, task.periodicity.measure)
            .format('YYYY-MM-DD');

        const endDate = date.clone()
            .subtract(task.gap.value, task.gap.measure)
            .format('YYYY-MM-DD');

        return { beginDate, endDate };
    }

    static async findExpectedEmailsForSubType(date, type) {
        let expectedNumberOfEmails = 0;
        const subs = await Subscription.find({ 'resource.type': 'EMAIL', datasets: new RegExp(type) });
        const { beginDate, endDate } = EmailValidationService.getBeginAndEndDatesForCron(type, date);

        for (const sub of subs) {
            try {
                const res = await sub.publish(
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

    static async getGLADEmailsValidationObject(date) {
        const gladExpected = await EmailValidationService.findExpectedEmailsForSubType(date, 'glad-alerts');
        const gladSparkpostCount = await SparkpostService.getGLADCountInjectedOnDate(date);

        const expectedUpperLimit = gladExpected + (SUCCESS_RANGE * gladExpected);
        const expectedLowerLimit = gladExpected - (SUCCESS_RANGE * gladExpected);
        return {
            success: gladSparkpostCount >= expectedLowerLimit && gladSparkpostCount <= expectedUpperLimit,
            expectedSubscriptionEmailsSent: gladExpected,
            sparkPostAPICalls: gladSparkpostCount,
        };
    }

    static async getVIIRSEmailsValidationObject(date) {
        const viirsExpected = await EmailValidationService.findExpectedEmailsForSubType(date, 'viirs-active-fires');
        const viirsSparkpostCount = await SparkpostService.getVIIRSCountInjectedOnDate(date);

        const expectedUpperLimit = viirsExpected + (SUCCESS_RANGE * viirsExpected);
        const expectedLowerLimit = viirsExpected - (SUCCESS_RANGE * viirsExpected);
        return {
            success: viirsSparkpostCount >= expectedLowerLimit && viirsSparkpostCount <= expectedUpperLimit,
            expectedSubscriptionEmailsSent: viirsExpected,
            sparkPostAPICalls: viirsSparkpostCount,
        };
    }

    static async getMonthlyEmailsValidationObject(date) {
        if (date.date() === 1) {
            const monthlyExpected = await EmailValidationService.findExpectedEmailsForSubType(date, 'monthly-summary');
            const monthlySparkpostCount = await SparkpostService.getMonthlyCountInjectedOnDate(date);

            const expectedUpperLimit = monthlyExpected + (SUCCESS_RANGE * monthlyExpected);
            const expectedLowerLimit = monthlyExpected - (SUCCESS_RANGE * monthlyExpected);
            return {
                success: monthlySparkpostCount >= expectedLowerLimit && monthlySparkpostCount <= expectedUpperLimit,
                expectedSubscriptionEmailsSent: monthlyExpected,
                sparkPostAPICalls: monthlySparkpostCount,
            };
        }

        return {
            success: true,
            expectedSubscriptionEmailsSent: 0,
            actualSubscriptionEmailsSent: 0,
            sparkPostAPICalls: 0,
        };
    }

    static async validateSubscriptionEmailCount(date = moment()) {
        logger.info(`[SubscriptionValidation] Starting validation process for subscriptions for date ${date.toISOString()}`);

        const glad = await EmailValidationService.getGLADEmailsValidationObject(date);
        const viirs = await EmailValidationService.getVIIRSEmailsValidationObject(date);
        const monthly = await EmailValidationService.getMonthlyEmailsValidationObject(date);

        logger.info(`[SubscriptionValidation] Ended validation process.`);
        logger.info(`[SubscriptionValidation] GLAD: ${JSON.stringify(glad)}`);
        logger.info(`[SubscriptionValidation] VIIRS: ${JSON.stringify(viirs)}`);
        logger.info(`[SubscriptionValidation] Monthly: ${JSON.stringify(monthly)}`);

        if (glad.success && viirs.success && monthly.success) {
            logger.info(`[SubscriptionValidation] Validation process was successful for ${date.toISOString()}, triggering success action`);
            await SlackService.subscriptionsValidationSuccessMessage(date, glad, viirs, monthly);
        } else {
            logger.info(`[SubscriptionValidation] Validation process was NOT successful for ${date.toISOString()}, triggering failure action`);
            await SlackService.subscriptionsValidationFailureMessage(date, glad, viirs, monthly);
        }

        return {
            date,
            glad,
            viirs,
            monthly,
        };
    }

}

module.exports = EmailValidationService;
