import Subscription, { ISubscription } from 'models/subscription';

import _ from 'lodash';
import logger from 'logger';
import mongoose, { PaginateResult } from 'mongoose';
import SubscriptionSerializer, { SerializedSubscriptionResponse } from 'serializers/subscription.serializer';
import mailService from 'services/mailService';
import UrlService from 'services/urlService';
import { EmailLanguageType } from 'types/email.type';

class SubscriptionService {

    static getSupportedLanguages(): string[] {
        return ['en', 'fr', 'es_MX', 'pt_BR', 'zh', 'id'];
    }

    /**
     * @todo this (and other service) method could benefit from a DTO
     */
    static formatSubscription(subscription: Record<string, any>): Partial<ISubscription> {
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
            confirmed: subscription.confirmed,
            env: subscription.env || 'production'
        };
    }

    static async createSubscription(data: Record<string, any>): Promise<Record<string, any>> {
        logger.info('Creating subscription with data ', data);
        data.userId = (data.loggedUser.id === 'microservice') ? data.userId : data.loggedUser.id;

        // Sanitize subscription language
        if (!SubscriptionService.getSupportedLanguages().includes(data.language)) {
            data.language = 'en';
        }

        const subscriptionFormatted: Partial<ISubscription> = SubscriptionService.formatSubscription(data);
        logger.debug('Creating subscription ', subscriptionFormatted);
        delete subscriptionFormatted.createdAt;
        delete subscriptionFormatted.updatedAt;
        if (subscriptionFormatted.resource.type === 'URL') {
            subscriptionFormatted.confirmed = true;
        }
        const subscription: ISubscription = await new Subscription(subscriptionFormatted).save();
        if (subscriptionFormatted.resource.type !== 'URL') {
            SubscriptionService.sendConfirmation(subscription);
        }

        return SubscriptionSerializer.serialize(subscription);
    }

    static sendConfirmation(subscription: ISubscription): SerializedSubscriptionResponse {
        logger.info('Sending confirmation email', subscription.toJSON());
        if (subscription.resource.type === 'EMAIL') {
            const language: EmailLanguageType = subscription.language.toLowerCase().replace(/_/g, '-') as EmailLanguageType;
            const application: string = subscription.application || 'gfw';
            mailService.sendSubscriptionConfirmationEmail(language, application, {
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

    static async confirmSubscription(id: string): Promise<ISubscription> {
        const subscription: ISubscription = await Subscription.where({
            _id: id,
        }).findOne();

        subscription.confirmed = true;
        return await subscription.save();
    }

    static async updateSubscription(id: string, data: Record<string, any>): Promise<SerializedSubscriptionResponse> {
        const subscription: ISubscription = await Subscription.findById(id);
        let attributes: Partial<Record<keyof ISubscription, any>> = _.omitBy(data, _.isNil);
        attributes = _.omit(attributes, 'loggedUser');

        for (const [key, value] of Object.entries(attributes)) {
            // https://github.com/microsoft/TypeScript/issues/31663#issuecomment-519563197
            (subscription[key as keyof ISubscription] as any) = value;
        }

        // Sanitize subscription language
        if (!SubscriptionService.getSupportedLanguages().includes(subscription.language)) {
            subscription.language = 'en';
        }

        await subscription.save();

        return SubscriptionSerializer.serialize(subscription);
    }

    static async deleteSubscriptionById(id: string): Promise<SerializedSubscriptionResponse> {
        const subscription: ISubscription = await Subscription.where({
            _id: id,
        }).findOneAndRemove();

        return SubscriptionSerializer.serialize(subscription);
    }

    static async getSubscriptionForUser(id: string, userId: string): Promise<SerializedSubscriptionResponse> {
        const subscription: ISubscription = await Subscription.where({
            _id: id,
            userId
        }).findOne();

        return SubscriptionSerializer.serialize(subscription);
    }

    static async getSubscriptionById(id: string): Promise<ISubscription> {
        return Subscription.findById(id.toString());
    }

    static async getSubscriptionsByLayer(slugs: string[]): Promise<ISubscription[]> {
        return Subscription.find({
            datasets: { $in: slugs },
            confirmed: true
        }).exec();
    }

    static async getAllSubscriptions(
        link: string,
        application: string = undefined,
        env: string = undefined,
        page: number = 1,
        limit: number = 10,
        updatedAtSince: string = null,
        updatedAtUntil: string = null,
    ): Promise<SerializedSubscriptionResponse> {
        const filter: Partial<Record<keyof ISubscription, any>> = {};
        if (application) filter.application = application;

        if (env) {
            filter.env = {
                $in: env.split(',')
            };
        } else {
            filter.env = 'production';
        }

        if (updatedAtSince || updatedAtUntil) {
            filter.updatedAt = {};
            if (updatedAtSince) filter.updatedAt.$gte = new Date(updatedAtSince).toISOString();
            if (updatedAtUntil) filter.updatedAt.$lte = new Date(updatedAtUntil).toISOString();
        }

        const subscriptions: PaginateResult<ISubscription> = await Subscription.paginate(filter, {
            page,
            limit,
            sort: 'id'
        });
        return SubscriptionSerializer.serializeList(subscriptions, link);
    }

    static async getSubscriptionsForUser(userId: string, application: string = undefined, env: string = undefined): Promise<SerializedSubscriptionResponse> {
        const filter: Partial<Record<keyof ISubscription, any>> = { userId };
        if (application) filter.application = application;
        if (env) filter.env = env;

        logger.debug(`[SubscriptionService - getSubscriptionsForUser] - loading subscriptions for filter ${JSON.stringify(filter)}`);
        const subscriptions: ISubscription[] = await Subscription.find(filter).exec();
        return SubscriptionSerializer.serialize(subscriptions);
    }

    static async getSubscriptionsByIds(ids: string[]): Promise<SerializedSubscriptionResponse> {
        const idsToFind: mongoose.Types.ObjectId[] = ids
            .filter(mongoose.Types.ObjectId.isValid)
            .map((id: string) => new mongoose.Types.ObjectId(id));

        const subscriptions: ISubscription[] = await Subscription.find({ _id: { $in: idsToFind } });
        return SubscriptionSerializer.serialize(subscriptions);
    }

}

export default SubscriptionService;
