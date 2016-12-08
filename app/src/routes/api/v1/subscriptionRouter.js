'use strict';

var Router = require('koa-router');
var UrlService = require('services/urlService');
var logger = require('logger');
var Subscription = require('models/subscription');
var SubscriptionService = require('services/subscriptionService');
var UpdateService = require('services/updateService');
var imageService = require('services/imageService');
var config = require('config');
var router = new Router({
  prefix: '/subscriptions'
});

const CHANNEL = 'subscription_alerts';
var AsyncClient = require('vizz.async-client');
var asynClient = new AsyncClient(AsyncClient.REDIS, {
    url: `redis://${config.get('redisLocal.host')}:${config.get('redisLocal.port')}`
});
asynClient = asynClient.toChannel(CHANNEL);

class SubscriptionsRouter {
  static * getSubscription() {
    logger.debug(this.request.query.loggedUser);
    var user = JSON.parse(this.request.query.loggedUser),
        id = this.params.id;

    try {
      this.body = yield SubscriptionService.getSubscriptionForUser(id, user.id);
    } catch (err) {
      logger.error(err);
    }
  }

  static * getSubscriptions() {
    var user = JSON.parse(this.request.query.loggedUser);

    try {
      this.body = yield SubscriptionService.getSubscriptionsForUser(user.id);
    } catch (err) {
      logger.error(err);
    }
  }

  static validateSubscription(subs){
      if(!subs.datasets || subs.datasets.length === 0) {
          return 'Dataset required';
      }
      if(!subs.language){
          return 'Language required';
      }
      if(!subs.resource){
          return 'Resource required';
      }
      return null;
  }

  static * createSubscription() {
    logger.info('Creating subscription with body', this.request.body);
    try {
        let message = SubscriptionsRouter.validateSubscription(this.request.body);
        if (message) {
            this.throw(400, message);
            return;
        }
        this.body = yield SubscriptionService.createSubscription(this.request.body);
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  static * confirmSubscription() {
    logger.info('Confirming subscription by id %s', this.params.id);
    try {
      yield SubscriptionService.confirmSubscription(
        this.params.id);
      this.redirect(UrlService.flagshipUrl(
        '/my_gfw/subscriptions?subscription_confirmed=true'));
    } catch (err) {
      logger.error(err);
    }
  }

  static * sendConfirmation() {
    logger.info('Resending confirmation email for subscription with id %s', this.params.id);
    var user = JSON.parse(this.request.query.loggedUser),
        id = this.params.id;

    let subscription = yield Subscription.where({
      _id: id,
      userId: user.id
    }).findOne();

    try {
      SubscriptionService.sendConfirmation(subscription);
      logger.info('Redirect to ', this.headers.referer);
      this.redirect(config.get('gfw.flagshipUrl') + '/my_gfw/subscriptions');
    } catch (err) {
      logger.error(err);
    }
  }

  static * updateSubscription() {
    logger.info('Update subscription by id %s', this.params.id);
    try {
      this.body = yield SubscriptionService.updateSubscription(
        this.params.id, this.request.body.loggedUser.id, this.request.body);
    } catch (err) {
      logger.error(err);
    }
  }

  static * unsubscribeSubscription() {
    logger.info('Unsubscribing subscription by id %s', this.params.id);
    let subscription = yield SubscriptionService.deleteSubscriptionById(
      this.params.id);

    if (!subscription) {
      logger.error('Subscription not found');
      this.throw(404, 'Subscription not found');
      return;
    }
    if(this.query.redirect){
        this.redirect(UrlService.flagshipUrl(
          '/my_gfw/subscriptions?unsubscription_confirmed=true'));
        return;
    }
    this.body = subscription;
  }

  static * deleteSubscription() {
    logger.info('Deleting subscription by id %s', this.params.id);
    let subscription = yield SubscriptionService.deleteSubscriptionById(
      this.params.id, JSON.parse(this.request.query.loggedUser).id);

    if (!subscription) {
      logger.error('Subscription not found');
      this.throw(404, 'Subscription not found');
      return;
    }

    this.body = subscription;
  }

  static * notifyUpdates() {
    const dataset = this.params.dataset;
    logger.info(`Notify '${dataset}' was updated`);
    let result = yield UpdateService.checkUpdated(dataset);
    logger.info(`Checking if '${dataset}' was updating`);

    if(result.updated) {
      asynClient.emit(JSON.stringify({
          layer_slug: dataset,
          begin_date: new Date(result.beginDate),
          end_date: new Date(result.endDate)
      }));
      this.body = `Dataset:${dataset} was updated`;
    } else {
      logger.info(`${dataset} was not updated`);
      this.body = `Dataset:${dataset} wasn't updated`;
    }
  }

}

router.post('/', SubscriptionsRouter.createSubscription);
router.get('/', SubscriptionsRouter.getSubscriptions);
router.get('/:id', SubscriptionsRouter.getSubscription);
router.get('/:id/confirm', SubscriptionsRouter.confirmSubscription);
router.get('/:id/send_confirmation', SubscriptionsRouter.sendConfirmation);
router.get('/:id/unsubscribe', SubscriptionsRouter.unsubscribeSubscription);
router.patch('/:id', SubscriptionsRouter.updateSubscription);
router.delete('/:id', SubscriptionsRouter.deleteSubscription);
router.post('/notify-updates/:dataset', SubscriptionsRouter.notifyUpdates);

module.exports = router;
