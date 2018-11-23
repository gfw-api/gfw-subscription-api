'use strict';

var _ = require('lodash');
var logger = require('logger');
var Subscription = require('models/subscription');
var SubscriptionSerializer = require('serializers/subscriptionSerializer');
var config = require('config');

var mailService = require('services/mailService');
var UrlService = require('services/urlService');

class SubscriptionService {

    static formatSubscription(subscription) {
        if (!subscription) {
            return {};
        }

        return {
            name: subscription.name,
            createdAt: subscription.created_at,
            updatedAt: subscription.updated_at,
            userId: subscription.userId,
            params: subscription.params,
            resource: subscription.resource,
            datasets: subscription.datasets,
            datasetsQuery: subscription.datasetsQuery,
            application: subscription.application || 'gfw',
            language: subscription.language,
            env: subscription.env || 'production'
        };
    }

    static* createSubscription(data) {
        logger.info('Creating subscription with data ', data);
        data.userId = data.loggedUser.id;

        let subscriptionFormatted = SubscriptionService.formatSubscription(data);
        logger.debug('Creating subscription ', subscriptionFormatted);
        delete subscriptionFormatted.createdAt;
        delete subscriptionFormatted.updatedAt;
        if (subscriptionFormatted.resource.type === 'URL') {
            subscriptionFormatted.confirmed = true;
        }
        let subscription = yield new Subscription(subscriptionFormatted).save();
        if (subscriptionFormatted.resource.type !== 'URL') {
            SubscriptionService.sendConfirmation(subscription);
        }

        return SubscriptionSerializer.serialize(subscription);
    }

    static sendConfirmation(subscription) {
        logger.info('Sending confirmation email', subscription);
        if (subscription.resource.type === 'EMAIL') {
            let language = subscription.language.toLowerCase().replace(/_/g, '-');
            let application = subscription.application || 'gfw';
            let template = `subscription-confirmation-${language}`;
            if (application !== 'gfw') {
                template = `subscription-confirmation-${application}-${language}`;
            }
            mailService.sendMail(template, {
                confirmation_url: UrlService.confirmationUrl(subscription)
            }, [{
                address: subscription.resource.content
            }]);

            return SubscriptionSerializer.serialize(
                SubscriptionService.formatSubscription(subscription));
        }
    }

    static* confirmSubscription(id) {
        let subscription = yield Subscription.where({
            _id: id,
        }).findOne();

        subscription.confirmed = true;
        subscription.save();

        return SubscriptionSerializer.serialize(
            SubscriptionService.formatSubscription(subscription));
    }

    static* updateSubscription(id, userId, data) {
        let subscription = yield Subscription.where({
            _id: id,
            userId: userId
        }).findOne();
        let attributes = _.omitBy(data, _.isNil);
        attributes = _.omit(attributes, 'loggedUser');
        _.each(attributes, function (value, attribute) {
            subscription[attribute] = value;
        });

        yield subscription.save();

        return SubscriptionSerializer.serialize(subscription);
    }

    static* deleteSubscriptionById(id) {
        let subscription = yield Subscription.where({
            _id: id,
        }).findOneAndRemove();

        return SubscriptionSerializer.serialize(subscription);
    }

    static* getSubscriptionForUser(id, userId) {
        let subscription = yield Subscription.where({
            _id: id,
            userId: userId
        }).findOne();

        return SubscriptionSerializer.serialize(subscription);
    }

    static* getSubscriptionById(id) {
        let subscription = yield Subscription.where({
            _id: id
        }).findOne();
        return subscription;
    }

    static* getSubscriptionsByLayer(layerSlug) {
        let subscriptions = yield Subscription.find({
            datasets: {
                $in: [layerSlug]
            },
            confirmed: true
        }).exec();
        return subscriptions;
    }

    static* getSubscriptionsForUser(userId, application, env) {
        let subscriptions = yield Subscription.find({
            userId: userId,
            application,
            env
        }).exec();

        return SubscriptionSerializer.serialize(subscriptions);
    }
}

module.exports = SubscriptionService;
