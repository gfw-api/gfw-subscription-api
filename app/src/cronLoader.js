'use strict';

var logger = require('logger');
var moment = require('moment');
var CronJob = require('cron').CronJob;
var config = require('config');

var taskConfig = require('../../config/cron.json');

var SubscriptionEvent = require('models/subscriptionEvent');

const CHANNEL = 'subscription_alerts';
var AsyncClient = require('vizz.async-client');
var asynClient = new AsyncClient(AsyncClient.REDIS, {
    url: `redis://${config.get('redisLocal.host')}:${config.get('redisLocal.port')}`
});
asynClient = asynClient.toChannel(CHANNEL);


var load = function() {
  taskConfig.forEach(function(task) {

    /* THIS CODE IS TO TEST */
    logger.info('Creating cron task for ' + task.name);


    new CronJob(task.crontab, function() {
        logger.info('Publishing ' + task.dataset);
        let beginData = moment().subtract(task.gap.value, task.gap.measure).subtract(task.periodicity.value, task.periodicity.measure).toDate();
        let endDate = moment().subtract(task.gap.value, task.gap.measure).toDate();

        asynClient.emit(JSON.stringify({
            layer_slug: task.dataset,
            begin_date: beginData,
            end_date: endDate
        }));
    }, null, true, 'Europe/London');
  });
};

module.exports = {load: load};
