'use strict';

var _ = require('lodash');

var Subscription = require('models/subscription');
var SubscriptionSerializer = require('serializers/subscriptionSerializer');
var config = require('config');

var mailService = require('services/mailService');
var UrlService = require('services/urlService');

class SubscriptionService {

  static formatSubscription(subscription) {
    if (!subscription) { return {}; }

    return {
      name: subscription.name,
      createdAt: subscription.created_at,
      updatedAt: subscription.updated_at,
      userId: subscription.userId,
      params: subscription.params,
      geostoreId: subscription.geostoreId,
      resource: subscription.resource,
      datasets: subscription.datasets
    };
  }

  static * createSubscription(data) {
    data.userId = data.loggedUser.id;

    let subscriptionFormatted = SubscriptionService.formatSubscription(data);
    let subscription = yield new Subscription(subscriptionFormatted).save();
    let serializedSubscription = SubscriptionSerializer.serialize(subscriptionFormatted);

    SubscriptionService.sendConfirmation(subscription);

    return serializedSubscription;
  }

  static sendConfirmation(subscription) {
    if (subscription.resource.type === 'EMAIL') {
      mailService.sendMail('subscription-confirmation', {
        confirmation_url: UrlService.confirmationUrl(subscription)
      },[{
          address: subscription.resource.content
      }]);

      return SubscriptionSerializer.serialize(
        SubscriptionService.formatSubscription(subscription));
    }
  }

  static * confirmSubscription(id, userId) {
    let subscription = yield Subscription.where({
      _id: id,
      userId: userId
    }).findOne();

    subscription.confirmed = true;
    subscription.save();

    return SubscriptionSerializer.serialize(
      SubscriptionService.formatSubscription(subscription));
  }

  static * updateSubscription(id, userId, data) {
    let subscription = yield Subscription.where({
      _id: id,
      userId: userId
    }).findOne();

    let attributes = _.omitBy(data, _.isNil);
    attributes = _.omit(attributes, 'loggedUser');
    _.each(attributes, function(value, attribute) {
      subscription[attribute] = value;
    });

    subscription.save();

    return SubscriptionSerializer.serialize(
      SubscriptionService.formatSubscription(subscription));
  }

  static * deleteSubscriptionById(id, userId) {
    let subscription = yield Subscription.where({
      _id: id,
      userId: userId
    }).findOneAndRemove();

    return SubscriptionSerializer.serialize(
      SubscriptionService.formatSubscription(subscription));
  }

  static * getSubscriptionForUser(id, userId) {
    let subscription = yield Subscription.where({
      _id: id,
      userId: userId
    }).findOne();

    return SubscriptionSerializer.serialize(
      SubscriptionService.formatSubscription(subscription));
  }

  static * getSubscriptionById(id) {
    let subscription = yield Subscription.where({ _id: id }).findOne();
    return subscription;
  }

  static * getSubscriptionsByLayer(layerSlug) {
    let subscriptions = yield Subscription.find({ datasets: {$in: [layerSlug]}, confirmed: true }).exec();
    return subscriptions;
  }

  static * getSubscriptionsForUser(userId) {
    let subscriptions = yield Subscription.find({
      userId: userId
    }).exec();

    return SubscriptionSerializer.serialize(subscriptions);
  }
}

module.exports = SubscriptionService;
