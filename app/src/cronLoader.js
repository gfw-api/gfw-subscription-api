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
    setTimeout(function(){
        logger.debug('Sending event');
        // asynClient.emit(JSON.stringify({
        //     layer_slug: task.dataset,
        //     begin_date: new Date(Date.now() - 24*60*60*1000),
        //     end_date: new Date()
        // }));
    }, 2000);
    /* END TEST CODE */

    // new CronJob(task.crontab, function() {
    //     logger.info('Publishing ' + task.dataset);
    //     SubscriptionEvent.latestForDataset(task.dataset).then(function(event) {
    //
    //     });
    // }, null, true, 'Europe/London');
  });
};

module.exports = {load: load};
