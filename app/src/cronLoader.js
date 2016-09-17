'use strict';

var co = require('co');
var logger = require('logger');
var moment = require('moment');
var CronJob = require('cron').CronJob;
var config = require('config');
var UpdateService = require('services/updateService');

var taskConfig = require('../../config/cron.json');

var SubscriptionEvent = require('models/subscriptionEvent');

const CHANNEL = 'subscription_alerts';
var AsyncClient = require('vizz.async-client');
var asynClient = new AsyncClient(AsyncClient.REDIS, {
  url: `redis://${config.get('redisLocal.host')}:${config.get('redisLocal.port')}`
});
asynClient = asynClient.toChannel(CHANNEL);


var load = function() {
  logger.info('Running crons');
  taskConfig.forEach(function(task) {

    /* THIS CODE IS TO TEST */
    logger.info('Creating cron task for ' + task.name);


    new CronJob(task.crontab, function() {
      co(function*() {
        logger.info('Publishing ' + task.dataset);
        if (task.dataset !== 'viirs-active-fires') {
          logger.info(`Checking if dataset '${task.dataset}' was updated`);
          let result = yield UpdateService.checkUpdated(task.dataset);
          if (result.updated) {
            asynClient.emit(JSON.stringify({
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

          asynClient.emit(JSON.stringify({
            layer_slug: task.dataset,
            begin_date: beginData,
            end_date: endDate
          }));
        }
      }).then(function() {}, function(err) {
        logger.error(err);
      });



    }, null, true, 'Europe/London');
  });
};

module.exports = {
  load: load
};
