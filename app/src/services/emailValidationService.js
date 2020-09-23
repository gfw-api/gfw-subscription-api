const logger = require('logger');
const moment = require('moment');
const ctRegisterMicroservice = require('ct-register-microservice-node');

const Subscription = require('models/subscription');
const StatisticModel = require('models/statistic');

const GLADAlertsService = require('services/gladAlertsService');
const VIIRSAlertsService = require('services/viirsAlertsService');
const SlackService = require('services/slackService');
const SparkpostService = require('services/sparkpostService');

const taskConfig = require('../../../config/cron.json');

class EmailValidationService {

    static async countEmailsSentForSlugOnDate(date, slug) {
        return StatisticModel.countDocuments({
            slug,
            createdAt: {
                $gte: date.clone()
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .toDate(),

                $lt: date.clone()
                    .hours(23)
                    .minutes(59)
                    .seconds(59)
                    .toDate(),
            },
        });
    }

    static async getGLADEmailsValidationObject(date) {
        const gladExpected = await EmailValidationService.findGLADEmailSubscriptions(date);
        const gladSent = await EmailValidationService.countEmailsSentForSlugOnDate(date, 'glad-alerts');
        const gladSparkpostCount = await SparkpostService.getGLADCountInjectedOnDate(date);

        return {
            success: gladExpected === gladSent && gladSent === gladSparkpostCount,
            expectedSubscriptionEmailsSent: gladExpected,
            actualSubscriptionEmailsSent: gladSent,
            sparkPostAPICalls: gladSparkpostCount,
        };
    }

    static async getVIIRSEmailsValidationObject(date) {
        const viirsSubs = await EmailValidationService.findVIIRSEmailSubscriptions(date);
        const viirsSent = await EmailValidationService.countEmailsSentForSlugOnDate(date, 'viirs-active-fires');
        const viirsSparkpostCount = await SparkpostService.getVIIRSCountInjectedOnDate(date);

        return {
            success: viirsSubs === viirsSent && viirsSent === viirsSparkpostCount,
            expectedSubscriptionEmailsSent: viirsSubs,
            actualSubscriptionEmailsSent: viirsSent,
            sparkPostAPICalls: viirsSparkpostCount,
        };
    }

    static async getMonthlyEmailsValidationObject(date) {
        const monthlySubs = await EmailValidationService.findMonthlySummaryEmailSubscriptions(date);
        const monthlySent = await EmailValidationService.countEmailsSentForSlugOnDate(date, 'monthly-summary');
        const monthlySparkpostCount = await SparkpostService.getMonthlyCountInjectedOnDate(date);

        return {
            success: monthlySubs === monthlySent && monthlySent === monthlySparkpostCount,
            expectedSubscriptionEmailsSent: monthlySubs,
            actualSubscriptionEmailsSent: monthlySent,
            sparkPostAPICalls: monthlySparkpostCount,
        };
    }

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

    static async hasGLADAlertsForDate(beginDate, endDate, params) {
        const uri = await GLADAlertsService.getURLInPeriodForSubscription(beginDate, endDate, params);
        const result = await ctRegisterMicroservice.requestToMicroservice({
            uri: uri.replace('SELECT *', 'SELECT COUNT(*) as count'),
            method: 'GET',
            json: true,
        });

        return result.data && result.data[0] && result.data[0].count && result.data[0].count > 0;
    }

    static async hasVIIRSAlertsForDate(beginDate, endDate, params) {
        const uri = await VIIRSAlertsService.getURLInPeriodForSubscription(beginDate, endDate, params);
        const result = await ctRegisterMicroservice.requestToMicroservice({
            uri: uri.replace('SELECT *', 'SELECT COUNT(*) as count'),
            method: 'GET',
            json: true,
        });

        return result.data && result.data[0] && result.data[0].count && result.data[0].count > 0;
    }

    static async findGLADEmailSubscriptions(date) {
        const subs = await Subscription.find({ 'resource.type': 'EMAIL', datasets: /glad-alerts/i });
        const { beginDate, endDate } = EmailValidationService.getBeginAndEndDatesForCron('glad-alerts', date);
        const results = await Promise.all(subs.map((sub) => EmailValidationService
            .hasGLADAlertsForDate(beginDate, endDate, sub.params)
            // Suppress errors
            .catch((e) => logger.error(e))));
        return results.filter((e) => e === true).length;
    }

    static async findVIIRSEmailSubscriptions(date) {
        const subs = await Subscription.find({ 'resource.type': 'EMAIL', datasets: /viirs/i });
        const { beginDate, endDate } = EmailValidationService.getBeginAndEndDatesForCron('viirs-active-fires', date);
        const results = await Promise.all(subs.map((sub) => EmailValidationService
            .hasVIIRSAlertsForDate(beginDate, endDate, sub.params)
            // Suppress errors
            .catch((e) => logger.error(e))));
        return results.filter((e) => e === true).length;
    }

    static async findMonthlySummaryEmailSubscriptions(date) {
        const subs = await Subscription.find({ 'resource.type': 'EMAIL', datasets: /monthly/i });
        const { beginDate, endDate } = EmailValidationService.getBeginAndEndDatesForCron('monthly-summary', date);
        const gladResults = await Promise.all(subs.map((sub) => EmailValidationService
            .hasGLADAlertsForDate(beginDate, endDate, sub.params)
            // Suppress errors
            .catch((e) => logger.error(e))));

        const viirsResults = await Promise.all(subs.map((sub) => EmailValidationService
            .hasVIIRSAlertsForDate(beginDate, endDate, sub.params)
            // Suppress errors
            .catch((e) => logger.error(e))));

        return gladResults.filter((e, idx) => e === true && viirsResults[idx]).length;
    }

    static async validateSubscriptionEmailCount(date = moment()) {
        logger.info(`[SubscriptionValidation] Starting validation process for subscriptions for date ${date.toISOString()}`);

        const glad = await EmailValidationService.getGLADEmailsValidationObject(date);
        const viirs = await EmailValidationService.getVIIRSEmailsValidationObject(date);
        const monthly = await EmailValidationService.getMonthlyEmailsValidationObject(date);

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
