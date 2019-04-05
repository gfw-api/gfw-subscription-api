const co = require('co');
const logger = require('logger');
const moment = require('moment');
const CronJob = require('cron').CronJob;
const config = require('config');
const UpdateService = require('services/updateService');
const AsyncClient = require('vizz.async-client');
const taskConfig = require('../../config/cron.json');

const CHANNEL = 'subscription_alerts';
let asyncClient = new AsyncClient(AsyncClient.REDIS, {
    url: `redis://${config.get('redisLocal.host')}:${config.get('redisLocal.port')}`
}).toChannel(CHANNEL);

const getTask = function (task) {
    co(function* () {
        logger.info('Publishing ' + task.dataset);
        if (task.dataset === 'dataset') {
            asyncClient.emit(JSON.stringify({
                layer_slug: task.dataset
            }));
            return;
        }
        if (task.dataset !== 'viirs-active-fires' && task.dataset !== 'story' && task.dataset !== 'forma-alerts' && task.dataset !== 'forma250GFW') {
            logger.info(`Checking if dataset '${task.dataset}' was updated`);
            let result = yield UpdateService.checkUpdated(task.dataset);
            if (result.updated) {
                asyncClient.emit(JSON.stringify({
                    layer_slug: task.dataset,
                    begin_date: new Date(result.beginDate),
                    end_date: new Date(result.endDate)
                }));
            } else {
                logger.info(`${task.dataset} was not updated`);
            }
        } else {
            let beginData = moment().subtract(task.gap.value, task.gap.measure).subtract(task.periodicity.value, task.periodicity.measure).toDate();
            let endDate = moment().subtract(task.gap.value, task.gap.measure).toDate();

            asyncClient.emit(JSON.stringify({
                layer_slug: task.dataset,
                begin_date: beginData,
                end_date: endDate
            }));
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

        return new CronJob(task.crontab, getTask(task), null, true, 'Europe/London');
    });
};

module.exports = {
    load,
    getTask
};
