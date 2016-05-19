'use strict';

var Router = require('koa-router');
var logger = require('logger');
//var StoryValidator = require('validators/storyValidator');
var SubscriptionService = require('services/subscriptionService');
var router = new Router({
  prefix: '/subscriptions'
});

class SubscriptionsRouter {
  static * createSubscription() {
    logger.info('Creating subscription with body', this.request.body);
    try {
      this.body = yield SubscriptionService.createSubscription(this.request.body);
    } catch (err) {
      logger.error(err);
    }
  }

}

router.post('/', SubscriptionsRouter.createSubscription);

module.exports = router;
