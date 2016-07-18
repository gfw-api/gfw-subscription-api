'use strict';

var logger = require('logger');
var CronJob = require('cron').CronJob;

var taskConfig = require('../../config/cron.json');

var SubscriptionEvent = require('models/subscriptionEvent');

var load = function() {
  taskConfig.forEach(function(task) {
    logger.info('Creating cron task for ' + task.name);
    new CronJob(task.crontab, function() {
        logger.info('Publishing ' + task.dataset);
        SubscriptionEvent.latestForDataset(task.dataset).then(function(event) {

        });
    }, null, true, 'Europe/London');
  });
};

module.exports = {load: load};
