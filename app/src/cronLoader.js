const co = require('co');
const logger = require('logger');
const moment = require('moment');
const CronJob = require('cron').CronJob;
const config = require('config');
const UpdateService = require('services/updateService');
const redis = require("redis");
const taskConfig = require('../../config/cron.json');

const CHANNEL = config.get('apiGateway.subscriptionAlertsChannelName');

let redisClient = redis.createClient({
    url: `redis://${config.get('redisLocal.host')}:${config.get('redisLocal.port')}`
});

const getTask = function (task) {
    co(function* () {
        logger.info('[cronLoader] Publishing ' + task.dataset);
        if (task.dataset === 'dataset') {
            redisClient.publish(CHANNEL, JSON.stringify({
                layer_slug: task.dataset
            }));
            return;
        }
        if (task.dataset !== 'viirs-active-fires' && task.dataset !== 'story' && task.dataset !== 'forma-alerts' && task.dataset !== 'forma250GFW') {
            logger.info(`Checking if dataset '${task.dataset}' was updated`);
            let result = yield UpdateService.checkUpdated(task.dataset);
            if (result.updated) {

                logger.info(`[cronLoader] Emitting message: ${message} for dataset ${task.dataset}`);

                const message = JSON.stringify({
                    layer_slug: task.dataset,
                    begin_date: new Date(result.beginDate),
                    end_date: new Date(result.endDate)
                });

                redisClient.publish(CHANNEL, message);
            } else {
                logger.info(`${task.dataset} was not updated`);
            }
        } else {
            let beginData = moment().subtract(task.gap.value, task.gap.measure).subtract(task.periodicity.value, task.periodicity.measure).toDate();
            let endDate = moment().subtract(task.gap.value, task.gap.measure).toDate();

            const message = JSON.stringify({
                layer_slug: task.dataset,
                begin_date: beginData,
                end_date: endDate
            });

            logger.info(`[cronLoader] Emitting message: ${message} for dataset ${task.dataset}`);

            const emissionResult = redisClient.publish(CHANNEL, message);

            return emissionResult;
        }
    }).then(function () {
    }, function (err) {
        logger.error(err);
    });


};

const load = function () {
    logger.info('Running crons');
    return taskConfig.map((task) => {

        logger.info('Creating cron task for ' + task.name);

        const onDone = () => {
            logger.info(`[cronLoader] cron task ${task.name} finished successfully`)
        };

        return new CronJob(task.crontab, getTask(task), onDone, true, 'Europe/London');
    });
};

module.exports = {
    load,
    getTask
};
