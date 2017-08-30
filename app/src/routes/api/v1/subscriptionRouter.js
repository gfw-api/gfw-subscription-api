'use strict';

const Router = require('koa-router');
const UrlService = require('services/urlService');
const logger = require('logger');
const coRequest = require('co-request');
const Subscription = require('models/subscription');
const SubscriptionService = require('services/subscriptionService');
const UpdateService = require('services/updateService');
const imageService = require('services/imageService');
const StatisticsService = require('services/statisticsService');
const mailService = require('services/mailService');
const MockService = require('services/mockService');
const GenericError = require('errors/genericError');
const config = require('config');
const router = new Router({
  prefix: '/subscriptions'
});

const CHANNEL = 'subscription_alerts';
const AsyncClient = require('vizz.async-client');
let asynClient = new AsyncClient(AsyncClient.REDIS, {
  url: `redis://${config.get('redisLocal.host')}:${config.get('redisLocal.port')}`
});
asynClient = asynClient.toChannel(CHANNEL);

class SubscriptionsRouter {
  static * getSubscription() {
    logger.debug(JSON.parse(this.request.query.loggedUser));
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
      this.body = yield SubscriptionService.getSubscriptionsForUser(user.id, this.query.application || 'gfw');
    } catch (err) {
      logger.error(err);
    }
  }

  static validateSubscription(subs) {
    if ( (!subs.datasets || subs.datasets.length === 0) && (!subs.datasetsQuery || subs.datasetsQuery.length === 0)) {
      return 'Dataset or datasetsQuery required';
    }
    if (!subs.language) {
      return 'Language required';
    }
    if (!subs.resource) {
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
      if (this.query.application && this.query.application === 'rw'){
        this.redirect(UrlService.flagshipUrlRW('/myrw/areas'));
      } else {
        this.redirect(UrlService.flagshipUrl('/my_gfw/subscriptions?subscription_confirmed=true'));
      }
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
    if (this.query.redirect) {
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

    if (result.updated) {
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

  static * statistics() {
    logger.info('Obtaining statistics');
    this.assert(this.query.start, 400, 'Start date required');
    this.assert(this.query.end, 400, 'End date required');
    this.body = yield StatisticsService.getStatistics(new Date(this.query.start), new Date(this.query.end));
  }

  static * checkHook() {
    logger.info('Checking hook');
    const info = this.request.body;
    const slug = info.slug ? info.slug : 'viirs-active-fires';
    const mock = yield MockService.getMock(slug);
    if (info.type === 'EMAIL') {
      mailService.sendMail('fires-notification-en', mock, [{email: info.content}]);
    } else {
      try {
        yield coRequest({
          uri: info.content,
          method: 'POST',
          body: mock,
          json: true
        });
      } catch (e) {
        throw new GenericError(400, `${e.message}`);
      }
    }
    this.body = 'ok';
  }

}

const isAdmin = function* (next) {
  let loggedUser = this.request.body ? this.request.body.loggedUser : null;
  if (!loggedUser) {
    loggedUser = this.query.loggedUser ? JSON.parse(this.query.loggedUser) : null;
  }
  if (!loggedUser) {
    this.throw(403, 'Not authorized');
    return;
  }
  if (loggedUser.role !== 'ADMIN') {
    this.throw(403, 'Not authorized');
    return;
  }
  if (!loggedUser.extraUserData || !loggedUser.extraUserData.apps || loggedUser.extraUserData.apps.indexOf('gfw') === -1)  {
    this.throw(403, 'Not authorized');
    return;
  }
  yield next;
};

const existSubscription = function* (next) {
  const subscription = yield Subscription.findById(this.params.id);
  if (!subscription) {
    this.throw(404, 'Subscription not found');
    return;
  }
  yield next;
};

router.post('/', SubscriptionsRouter.createSubscription);
router.get('/', SubscriptionsRouter.getSubscriptions);
router.get('/:id', existSubscription, SubscriptionsRouter.getSubscription);
router.get('/:id/confirm', existSubscription, SubscriptionsRouter.confirmSubscription);
router.get('/:id/send_confirmation', existSubscription, SubscriptionsRouter.sendConfirmation);
router.get('/:id/unsubscribe', existSubscription, SubscriptionsRouter.unsubscribeSubscription);
router.patch('/:id',existSubscription,  SubscriptionsRouter.updateSubscription);
router.delete('/:id', existSubscription, SubscriptionsRouter.deleteSubscription);
router.post('/notify-updates/:dataset', SubscriptionsRouter.notifyUpdates);
router.get('/statistics', isAdmin, SubscriptionsRouter.statistics);
router.post('/check-hook', SubscriptionsRouter.checkHook);

module.exports = router;
