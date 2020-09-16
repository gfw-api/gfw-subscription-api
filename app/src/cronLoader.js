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

const getTask = async (task) => {
    logger.info(`[cronLoader] Publishing ${task.dataset}`);
    if (task.dataset === 'dataset') {
        redisClient.publish(CHANNEL, JSON.stringify({
            layer_slug: task.dataset
        }));
        return;
    }

    if (task.dataset === 'subs-emails-validation') {
        await EmailValidationService.validateSubscriptionEmailCount(moment());
        return;
    }

    if (
        task.dataset !== 'viirs-active-fires'
        && task.dataset !== 'story'
        && task.dataset !== 'forma-alerts'
        && task.dataset !== 'forma250GFW'
        && task.dataset !== 'glad-alerts'
        && task.dataset !== 'monthly-summary'
    ) {
        logger.info(`Checking if dataset '${task.dataset}' was updated`);
        const result = await UpdateService.checkUpdated(task.dataset);
        if (result.updated) {
            const message = JSON.stringify({
                layer_slug: task.dataset,
                begin_date: new Date(result.beginDate),
                end_date: new Date(result.endDate)
            });

            logger.info(`[cronLoader] Emitting message: ${message} for dataset ${task.dataset}`);

            redisClient.publish(CHANNEL, message);
        } else {
            logger.info(`${task.dataset} was not updated`);
        }
    } else {
        const beginData = moment().subtract(task.gap.value, task.gap.measure).subtract(task.periodicity.value, task.periodicity.measure).toDate();
        const endDate = moment().subtract(task.gap.value, task.gap.measure).toDate();

        const message = JSON.stringify({
            layer_slug: task.dataset,
            begin_date: beginData,
            end_date: endDate
        });

        logger.info(`[cronLoader] Emitting message: ${message} for dataset ${task.dataset}`);

        redisClient.publish(CHANNEL, message);
    }
};

const load = () => {
    logger.info('Running crons');
    return taskConfig.map((task) => {

        logger.info(`Creating cron task for ${task.name}`);

        const onDone = () => {
            logger.info(`[cronLoader] cron task ${task.name} finished successfully`);
        };

        return new CronJob(task.crontab, () => {
            getTask(task);
        }, onDone, true, 'Europe/London');
    });
};

module.exports = {
    load,
    getTask
};
