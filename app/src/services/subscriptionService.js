const _ = require('lodash');
const logger = require('logger');
const Subscription = require('models/subscription');
const SubscriptionSerializer = require('serializers/subscriptionSerializer');

const mailService = require('services/mailService');
const UrlService = require('services/urlService');

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

    static async createSubscription(data) {
        logger.info('Creating subscription with data ', data);
        data.userId = data.loggedUser.id;

        const subscriptionFormatted = SubscriptionService.formatSubscription(data);
        logger.debug('Creating subscription ', subscriptionFormatted);
        delete subscriptionFormatted.createdAt;
        delete subscriptionFormatted.updatedAt;
        if (subscriptionFormatted.resource.type === 'URL') {
            subscriptionFormatted.confirmed = true;
        }
        const subscription = await new Subscription(subscriptionFormatted).save();
        if (subscriptionFormatted.resource.type !== 'URL') {
            SubscriptionService.sendConfirmation(subscription);
        }

        return SubscriptionSerializer.serialize(subscription);
    }

    static sendConfirmation(subscription) {
        logger.info('Sending confirmation email', subscription.toJSON());
        if (subscription.resource.type === 'EMAIL') {
            const language = subscription.language.toLowerCase().replace(/_/g, '-');
            const application = subscription.application || 'gfw';
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
                SubscriptionService.formatSubscription(subscription)
            );
        }

        return null;
    }

    static async confirmSubscription(id) {
        const subscription = await Subscription.where({
            _id: id,
        }).findOne();

        subscription.confirmed = true;
        subscription.save();

        return SubscriptionSerializer.serialize(
            SubscriptionService.formatSubscription(subscription)
        );
    }

    static async updateSubscription(id, userId, data) {
        const subscription = await Subscription.where({
            _id: id,
            userId
        }).findOne();
        let attributes = _.omitBy(data, _.isNil);
        attributes = _.omit(attributes, 'loggedUser');
        _.each(attributes, (value, attribute) => {
            subscription[attribute] = value;
        });

        await subscription.save();

        return SubscriptionSerializer.serialize(subscription);
    }

    static async deleteSubscriptionById(id) {
        const subscription = await Subscription.where({
            _id: id,
        }).findOneAndRemove();

        return SubscriptionSerializer.serialize(subscription);
    }

    static async getSubscriptionForUser(id, userId) {
        const subscription = await Subscription.where({
            _id: id,
            userId
        }).findOne();

        return SubscriptionSerializer.serialize(subscription);
    }

    static async getSubscriptionById(id) {
        const subscription = await Subscription.findById(id.toString());
        return subscription;
    }

    static async getSubscriptionsByLayer(layerSlug) {
        const subscriptions = await Subscription.find({
            datasets: {
                $in: [layerSlug]
            },
            confirmed: true
        }).exec();
        return subscriptions;
    }

    static async getSubscriptionsForUser(userId, application, env) {
        const subscriptions = await Subscription.find({
            userId,
            application,
            env
        }).exec();

        return SubscriptionSerializer.serialize(subscriptions);
    }

}

module.exports = SubscriptionService;
