import Router from 'koa-router';
import logger from 'logger';
import config from 'config';
import { get } from 'lodash';
import { Context, Next } from 'koa';
import USER_ROLES from 'app.constants';

import UrlService from 'services/urlService';
import moment from 'moment';
import mongoose from 'mongoose';
import Subscription, { ALERT_TYPES, ISubscription } from 'models/subscription';
import SubscriptionService from 'services/subscriptionService';
import SubscriptionSerializer, { SerializedSubscriptionResponse } from 'serializers/subscription.serializer';
import DatasetService from 'services/datasetService';
import StatisticsService from 'services/statisticsService';
import GenericError from 'errors/genericError';
import AlertQueue, { AlertQueueMessage } from 'queues/alert.queue';


const router: Router = new Router({
    prefix: '/api/v1/subscriptions'
});

const serializeObjToQuery = (obj: Record<string, any>): string => Object.keys(obj).reduce((a: any[], k: string) => {
    a.push(`${k}=${encodeURIComponent(obj[k])}`);
    return a;
}, []).join('&');

const getHostForPaginationLink: (ctx: Context) => string = (ctx: Context) => {
    if ('x-rw-domain' in ctx.request.header) {
        return ctx.request.header['x-rw-domain'] as string;
    }
    if ('referer' in ctx.request.header) {
        const url: URL = new URL(ctx.request.header.referer);
        return url.host;
    }
    return ctx.request.host as string;
};

interface User {
    id: string
    role: string
    extraUserData?: Record<string, any>
}

class SubscriptionsRouter {

    static getUser(ctx: Context): User {
        const { query, body } = ctx.request;

        let user: User;

        try {
            user = { ...(query.loggedUser ? JSON.parse(query.loggedUser as string) : {}), ...ctx.request.body.loggedUser };
        } catch (error) {
            ctx.throw(400, 'Invalid user token');
            return null;
        }

        if (body.fields && body.fields.loggedUser) {
            user = Object.assign(user, JSON.parse(body.fields.loggedUser));
        }

        logger.debug(`User from request: ${user}`);
        return user;
    }

    static async getSubscription(ctx: Context): Promise<void> {
        const loggedUser: User = SubscriptionsRouter.getUser(ctx);
        const { id } = ctx.params;

        try {
            ctx.body = loggedUser.role === 'ADMIN'
                ? SubscriptionSerializer.serialize(await SubscriptionService.getSubscriptionById(id))
                : await SubscriptionService.getSubscriptionForUser(id, loggedUser.id);
        } catch (err) {
            logger.error(err);
        }
    }

    static async getSubscriptionData(ctx: Context): Promise<void> {
        const loggedUser: User = SubscriptionsRouter.getUser(ctx);
        const { id } = ctx.params;
        try {
            const subscription: SerializedSubscriptionResponse = await SubscriptionService.getSubscriptionForUser(id, loggedUser.id);
            ctx.body = { data: await DatasetService.processSubscriptionData(subscription.data.id) };
        } catch (err) {
            logger.error(err);
            ctx.throw(404, 'Subscription not found');
        }
    }

    static async getSubscriptions(ctx: Context): Promise<void> {
        const loggedUser: User = SubscriptionsRouter.getUser(ctx);
        logger.info('Getting subscription for user ', loggedUser.id);

        try {
            ctx.body = await SubscriptionService.getSubscriptionsForUser(loggedUser.id, ctx.query.application as string || 'gfw', ctx.query.env as string || 'production');
        } catch (err) {
            logger.error(err);
        }
    }

    static validateSubscription(subscription: ISubscription): string {
        if ((!subscription.datasets || subscription.datasets.length === 0) && (!subscription.datasetsQuery || subscription.datasetsQuery.length === 0)) {
            return 'Datasets or datasetsQuery required';
        }
        if (!subscription.language) {
            return 'Language required';
        }
        if (!subscription.resource) {
            return 'Resource required';
        }
        if (!subscription.params) {
            return 'Params required';
        }
        return null;
    }

    static async createSubscription(ctx: Context): Promise<void> {
        logger.info('Creating subscription with body', ctx.request.body);
        const message: string = SubscriptionsRouter.validateSubscription(ctx.request.body);
        if (message) {
            ctx.throw(400, message);
            return;
        }
        ctx.body = await SubscriptionService.createSubscription(ctx.request.body);
    }

    static async confirmSubscription(ctx: Context): Promise<void> {
        logger.info('Confirming subscription by id %s', ctx.params.id);
        const subscription: ISubscription = await SubscriptionService.confirmSubscription(
            ctx.params.id
        );
        if (ctx.query.application && ctx.query.application === 'rw') {
            ctx.redirect(UrlService.flagshipUrlRW('/myrw/areas', subscription.env));
        } else {
            ctx.redirect(UrlService.flagshipUrl('/my-gfw/subscriptions?subscription_confirmed=true'));
        }
    }

    static async sendConfirmation(ctx: Context): Promise<void> {
        logger.info('Resending confirmation email for subscription with id %s', ctx.params.id);
        const loggedUser: User = SubscriptionsRouter.getUser(ctx);
        const { id } = ctx.params;

        const subscription: ISubscription = await Subscription.where({
            _id: id,
            userId: loggedUser.id
        }).findOne();

        try {
            await SubscriptionService.sendConfirmation(subscription);
            logger.info(`Redirect to: ${config.get('gfw.flagshipUrl')}/my-gfw/subscriptions`);

            // Allows redirect=false flag to be provided, but defaults to applying the redirect
            if (ctx.query.redirect !== 'false') {
                ctx.redirect(`${config.get('gfw.flagshipUrl')}/my-gfw/subscriptions`);
                return;
            }

            ctx.body = subscription;
        } catch (err) {
            logger.error(err);
        }
    }

    static async updateSubscription(ctx: Context): Promise<void> {
        logger.info('Update subscription by id %s', ctx.params.id);

        const message: string = SubscriptionsRouter.validateSubscription(ctx.request.body);
        if (message) {
            ctx.throw(400, message);
            return;
        }

        ctx.body = await SubscriptionService.updateSubscription(ctx.params.id, ctx.request.body);
    }

    static async unsubscribeSubscription(ctx: Context): Promise<void> {
        logger.info('Unsubscribing subscription by id %s', ctx.params.id);
        const subscription: SerializedSubscriptionResponse = await SubscriptionService.deleteSubscriptionById(
            ctx.params.id
        );

        if (!subscription) {
            logger.error('Subscription not found');
            ctx.throw(404, 'Subscription not found');
            return;
        }
        if (ctx.query.redirect) {
            ctx.redirect(UrlService.flagshipUrl(
                '/my-gfw/subscriptions?unsubscription_confirmed=true'
            ));
            return;
        }
        ctx.body = subscription;
    }

    static async deleteSubscription(ctx: Context): Promise<void> {
        logger.info('Deleting subscription by id %s', ctx.params.id);
        const subscription: SerializedSubscriptionResponse = await SubscriptionService.deleteSubscriptionById(
            ctx.params.id
        );

        if (!subscription) {
            logger.error('Subscription not found');
            ctx.throw(404, 'Subscription not found');
            return;
        }

        ctx.body = subscription;
    }

    static async statistics(ctx: Context): Promise<void> {
        logger.info('Obtaining statistics');
        ctx.assert(ctx.query.start, 400, 'Start date required');
        ctx.assert(ctx.query.end, 400, 'End date required');
        ctx.body = await StatisticsService.getStatistics(new Date(ctx.query.start as string), new Date(ctx.query.end as string), ctx.query.application as string);
    }

    static async statisticsGroup(ctx: Context): Promise<void> {
        logger.info('Obtaining statistics group');
        ctx.assert(ctx.query.start, 400, 'Start date required');
        ctx.assert(ctx.query.end, 400, 'End date required');
        ctx.assert(ctx.query.application, 400, 'Application required');
        ctx.body = await StatisticsService.infoGroupSubscriptions(new Date(ctx.query.start as string), new Date(ctx.query.end as string), ctx.query.application as string);
    }

    static async statisticsByUser(ctx: Context): Promise<void> {
        logger.info('Obtaining statistics by user');
        ctx.assert(ctx.query.start, 400, 'Start date required');
        ctx.assert(ctx.query.end, 400, 'End date required');
        ctx.assert(ctx.query.application, 400, 'Application required');
        ctx.body = await StatisticsService.infoByUserSubscriptions(new Date(ctx.query.start as string), new Date(ctx.query.end as string), ctx.query.application as string);
    }

    static async findByIds(ctx: Context): Promise<void> {
        const ids: string[] | null = get(ctx.request, 'body.ids', null);
        if (ids === null) {
            throw new GenericError(400, 'Ids not provided.');
        }

        logger.info(`[SubscriptionsRouter] Getting all subscriptions with ids`, ids);
        ctx.body = await SubscriptionService.getSubscriptionsByIds(ids);
    }

    static async findUserSubscriptions(ctx: Context): Promise<void> {
        logger.info(`[SubscriptionsRouter] Getting all subscriptions for user with id`, ctx.params.userId);
        ctx.body = await SubscriptionService.getSubscriptionsForUser(ctx.params.userId, ctx.query.application as string, ctx.query.env as string);
    }

    static async findAllSubscriptions(ctx: Context): Promise<void> {
        logger.info(`[SubscriptionsRouter] Getting ALL subscriptions`);

        let page: number = 1;
        let limit: number = 10

        if (ctx.query.page) {
            const { number, size } = (ctx.query.page as Record<string, any>);
            page = ctx.query.page && number ? parseInt(number, 10) : 1;
            limit = ctx.query.page && size ? parseInt(size, 10) : 10;
            if (limit > 100) {
                throw new GenericError(400, 'Invalid page size (>100).');
            }
        }

        const updatedAtSince: string = ctx.query.updatedAtSince ? ctx.query.updatedAtSince as string : null;
        const updatedAtUntil: string = ctx.query.updatedAtUntil ? ctx.query.updatedAtUntil as string : null;

        const clonedQuery: Record<string, any> = { ...ctx.query };
        delete clonedQuery['page[size]'];
        delete clonedQuery['page[number]'];
        delete clonedQuery.page;
        delete clonedQuery.loggedUser;
        const serializedQuery: string = serializeObjToQuery(clonedQuery) ? `?${serializeObjToQuery(clonedQuery)}&` : '?';
        const link: string = `${ctx.request.protocol}://${getHostForPaginationLink(ctx)}/v1/subscriptions/find-all${serializedQuery}`;

        const subscriptions: SerializedSubscriptionResponse = await SubscriptionService.getAllSubscriptions(
            link,
            ctx.request.query.application as string,
            ctx.request.query.env as string,
            page,
            limit,
            updatedAtSince,
            updatedAtUntil,
        );

        logger.info(`[SubscriptionsRouter] Subscriptions loaded, returning`);
        ctx.body = subscriptions;
    }

    static async testEmailAlert(ctx: Context): Promise<void> {
        const {
            fromDate,
            toDate,
        } = ctx.request.body;

        ctx.request.body.type = 'EMAIL';
        ctx.request.body.fromDate = fromDate ? moment(fromDate).toISOString() : moment().subtract('2', 'w').toISOString();
        ctx.request.body.toDate = toDate ? moment(toDate).toISOString() : moment().subtract('1', 'w').toISOString();

        return SubscriptionsRouter.testAlert(ctx);
    }

    static async testWebhookAlert(ctx: Context): Promise<void> {
        ctx.request.body.type = 'URL';

        return SubscriptionsRouter.testAlert(ctx);
    }

    static async testAlert(ctx: Context): Promise<void> {
        logger.info(`[EmailAlertsRouter] Starting test alert`);

        const {
            alert,
            email,
            url,
            subId,
            fromDate,
            toDate,
            language
        } = ctx.request.body;
        const type: ALERT_TYPES | undefined = ctx.request.body.type ? ctx.request.body.type.toUpperCase() : ctx.request.body.type;

        if (!subId) {
            ctx.throw(400, 'Subscription id is required.');
            return;
        }

        const supportedAlerts: string[] = [
            'glad-alerts',
            'viirs-active-fires',
            'monthly-summary',
            'glad-all',
            'glad-l',
            'glad-s2',
            'glad-radd',
        ]
        if (!supportedAlerts.includes(alert)) {
            ctx.throw(400, `The alert provided is not supported for testing. Supported alerts: ${supportedAlerts.join(',')}`);
            return;
        }

        if (type && !ALERT_TYPES.includes(type)) {
            ctx.throw(400, `The alert type provided is not supported. Supported alerts types: ${ALERT_TYPES.join(',')}`);
            return;
        }

        const message: AlertQueueMessage = {
            layer_slug: alert,
            begin_date: fromDate ? moment(fromDate).toISOString() : moment().subtract('1', 'w').toISOString(),
            end_date: toDate ? moment(toDate).toISOString() : moment().toISOString(),
            isTest: true,
            url,
            email,
            type,
            subId,
            language
        };

        try {
            await AlertQueue.processMessage(JSON.stringify(message));
            ctx.body = { success: true };
        } catch (e) {
            ctx.body = { success: false, message: e.message };
        }
    }

}

const isAdmin = async (ctx: Context, next: Next): Promise<any> => {
    const loggedUser: User = SubscriptionsRouter.getUser(ctx);

    if (!loggedUser || USER_ROLES.indexOf(loggedUser.role) === -1) {
        ctx.throw(401, 'Unauthorized');
        return;
    }
    if (loggedUser.role !== 'ADMIN') {
        ctx.throw(403, 'Not authorized');
        return;
    }
    if (!loggedUser.extraUserData || !loggedUser.extraUserData.apps || loggedUser.extraUserData.apps.indexOf('gfw') === -1) {
        ctx.throw(403, 'Not authorized');
        return;
    }
    await next();
};

const subscriptionExists = (isForUser: boolean = false) => async (ctx: Context, next: Next): Promise<any> => {
    const { id } = ctx.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        ctx.throw(400, 'ID is not valid');
    }

    const loggedUser: User = SubscriptionsRouter.getUser(ctx);
    const subscription: ISubscription = (isForUser && loggedUser.id !== 'microservice' && loggedUser.role !== 'ADMIN')
        ? await Subscription.findOne({ _id: id, userId: loggedUser.id })
        : await Subscription.findById(id);

    if (!subscription) {
        ctx.throw(404, 'Subscription not found');
    }
    await next();
};

const isMicroservice = (ctx: Context): boolean => {
    const loggedUser: User = SubscriptionsRouter.getUser(ctx);
    return loggedUser.id === 'microservice';
};

const isLoggedUser = (ctx: Context): boolean => {
    const loggedUser: User = SubscriptionsRouter.getUser(ctx);
    return (typeof loggedUser === 'object' && USER_ROLES.indexOf(loggedUser.role) !== -1);
};

const validateLoggedUserAuth = async (ctx: Context, next: Next): Promise<any> => {
    const loggedUser: User = SubscriptionsRouter.getUser(ctx);

    if (typeof loggedUser !== 'object' || USER_ROLES.indexOf(loggedUser.role) === -1) {
        logger.warn(`[SubscriptionRouter - validateLoggedUserAuth] Invalid user token: ${JSON.stringify(loggedUser)}`)
        ctx.throw(401, 'Unauthorized');
    }

    await next();
};

const validateMicroserviceAuth = async (ctx: Context, next: Next): Promise<any> => {
    if (!isMicroservice(ctx)) {
        ctx.throw(401, 'Unauthorized');
    }

    await next();
};

const validateLoggedUserOrMicroserviceAuth = async (ctx: Context, next: Next): Promise<any> => {
    if (!isLoggedUser(ctx) && !isMicroservice(ctx)) {
        ctx.throw(401, 'Unauthorized');
    }

    await next();
};

const isAdminOrMicroservice = async (ctx: Context, next: Next): Promise<any> => {
    const loggedUser: User = SubscriptionsRouter.getUser(ctx);

    if (isMicroservice(ctx) || (loggedUser && loggedUser.role && ['ADMIN', 'MICROSERVICE'].includes(loggedUser.role))) {
        return next();
    }

    return ctx.throw(401, 'Unauthorized');
};

router.post('/', SubscriptionsRouter.createSubscription);
router.get('/', validateLoggedUserAuth, SubscriptionsRouter.getSubscriptions);
router.get('/find-all', validateMicroserviceAuth, SubscriptionsRouter.findAllSubscriptions);
router.get('/statistics', isAdmin, SubscriptionsRouter.statistics);
router.get('/statistics-group', isAdmin, SubscriptionsRouter.statisticsGroup);
router.get('/statistics-by-user', isAdmin, SubscriptionsRouter.statisticsByUser);
router.get('/:id', validateLoggedUserAuth, subscriptionExists(true), SubscriptionsRouter.getSubscription); // not done
router.get('/:id/data', validateLoggedUserAuth, subscriptionExists(true), SubscriptionsRouter.getSubscriptionData);
router.get('/:id/confirm', subscriptionExists(), SubscriptionsRouter.confirmSubscription);
router.get('/:id/send_confirmation', validateLoggedUserAuth, subscriptionExists(true), SubscriptionsRouter.sendConfirmation);
router.get('/:id/unsubscribe', subscriptionExists(), SubscriptionsRouter.unsubscribeSubscription);
router.patch('/:id', validateLoggedUserOrMicroserviceAuth, subscriptionExists(true), SubscriptionsRouter.updateSubscription);
router.delete('/:id', validateLoggedUserOrMicroserviceAuth, subscriptionExists(true), SubscriptionsRouter.deleteSubscription);
router.post('/test-email-alerts', isAdmin, SubscriptionsRouter.testEmailAlert);
router.post('/test-webhook-alert', isAdmin, SubscriptionsRouter.testWebhookAlert);
router.post('/test-alert', isAdmin, SubscriptionsRouter.testAlert);
router.get('/user/:userId', isAdminOrMicroservice, SubscriptionsRouter.findUserSubscriptions);
router.post('/find-by-ids', validateMicroserviceAuth, SubscriptionsRouter.findByIds);

export default router;
