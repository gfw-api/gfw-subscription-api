'use strict';

var logger = require('logger');
var CronJob = require('cron').CronJob;

var taskConfig = require('../../config/cron.json');

var SubscriptionEvent = require('models/subscriptionEvent');

const CHANNEL = 'subscription_alerts';
var AsyncClient = require('async-client');
var asynClient = new AsyncClient(AsyncClient.REDIS, {
    url: require('config').get('apiGateway.queueUrl')
});
asynClient = asynClient.toChannel(CHANNEL);


var load = function() {
  taskConfig.forEach(function(task) {

    /* THIS CODE IS TO TEST */
    logger.info('Creating cron task for ' + task.name);


    new CronJob(task.crontab, function() {
        logger.info('Publishing ' + task.dataset);
        asynClient.emit(JSON.stringify({
            layer_slug: task.dataset,
            begin_date: new Date(Date.now() - task.periodicity),
            end_date: new Date()
        }));
    }, null, true, 'Europe/London');
  });
};

module.exports = {load: load};
