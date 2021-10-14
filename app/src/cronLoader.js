const logger = require('logger');
const moment = require('moment');
const { CronJob } = require('cron');
const config = require('config');
const UpdateService = require('services/updateService');
const redis = require('redis');
const EmailValidationService = require('services/emailValidationService');
const taskConfig = require('../../config/cron.json');

const CHANNEL = config.get('apiGateway.subscriptionAlertsChannelName');

const redisClient = redis.createClient({
    url: config.get('redis.url')
});

const supportedAlertTypes = [
    'monthly-summary',
    'viirs-active-fires',
    'glad-alerts',
    'glad-all',
    'glad-l',
    'glad-s2',
    'glad-radd',
];

const getTask = async (task) => {
    logger.info(`[cronLoader] Publishing ${task.dataset}`);
    if (task.dataset === 'dataset') {
        await redisClient.publish(CHANNEL, JSON.stringify({ layer_slug: task.dataset }));
        return;
    }

    if (task.dataset === 'subs-emails-validation') {
        await EmailValidationService.validateSubscriptionEmailCount(moment());
        return;
    }

    if (supportedAlertTypes.includes(task.dataset)) {
        const message = JSON.stringify({
            layer_slug: task.dataset,
            begin_date: moment().subtract(task.gap.value, task.gap.measure).subtract(task.periodicity.value, task.periodicity.measure).toDate(),
            end_date: moment().subtract(task.gap.value, task.gap.measure).toDate()
        });

        logger.info(`[cronLoader] Emitting message: ${message} for dataset ${task.dataset}`);

        await redisClient.publish(CHANNEL, message);
        return;
    }

    logger.info(`Checking if dataset '${task.dataset}' was updated`);
    const result = await UpdateService.checkUpdated(task.dataset);
    if (result.updated) {
        const message = JSON.stringify({
            layer_slug: task.dataset,
            begin_date: new Date(result.beginDate),
            end_date: new Date(result.endDate)
        });

        logger.info(`[cronLoader] Emitting message: ${message} for dataset ${task.dataset}`);

        await redisClient.publish(CHANNEL, message);
    } else {
        logger.info(`${task.dataset} was not updated`);
    }
};

const load = () => {
    logger.info('Running crons');
    return taskConfig.map((task) => {

        logger.info(`Creating cron task for ${task.name}`);

        const onDone = () => {
            logger.info(`[cronLoader] cron task ${task.name} finished successfully`);
        };

        return new CronJob(task.crontab, () => { getTask(task); }, onDone, true, 'Europe/London');
    });
};

module.exports = {
    load,
    getTask
};
