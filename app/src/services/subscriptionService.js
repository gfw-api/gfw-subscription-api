'use strict';

var logger = require('logger');
var Subscription = require('models/subscription');
var SubscriptionSerializer = require('serializers/subscriptionSerializer');
var config = require('config');

class SubscriptionService {

  static formatSubscription(subscription) {
    if (!subscription) { return {}; }

    return {
      name: subscription.name,
      createdAt: subscription.created_at,
      updatedAt: subscription.updated_at,
      userId: subscription.userId,
      geostoreId: subscription.geostoreId,
      resource: subscription.resource,
      layers: subscription.layers
    };
  }

  static * createSubscription(data) {
    data.userId = data.loggedUser.id;

    let subscriptionFormatted = SubscriptionService.formatSubscription(data);
    yield new Subscription(subscriptionFormatted).save();

    return SubscriptionSerializer.serialize(subscriptionFormatted);
  }

  static * deleteSubscriptionById(id, userId) {
    let subscription = yield SubscriptionService.getSubscriptionById(
      id, userId);
    yield subscription.remove();

    return SubscriptionSerializer.serialize(subscription);
  }

  static * getSubscriptionById(id, userId) {
    let subscription = yield Subscription.findOne({
      id: id,
      userId: userId
    });

    return SubscriptionSerializer.serialize(subscription);
  }

  static * getSubscriptionsForUser(userId) {
    let subscriptions = yield Subscription.find({
      userId: userId
    });

    return SubscriptionSerializer.serialize(subscriptions);
  }
}

module.exports = SubscriptionService;
