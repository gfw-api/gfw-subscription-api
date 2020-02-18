const Router = require('koa-router');
const UrlService = require('services/urlService');
const logger = require('logger');
const request = require('request-promise-native');
const Subscription = require('models/subscription');
const SubscriptionService = require('services/subscriptionService');
const UpdateService = require('services/updateService');
const DatasetService = require('services/datasetService');
const StatisticsService = require('services/statisticsService');
const mailService = require('services/mailService');
const MockService = require('services/mockService');
const GenericError = require('errors/genericError');
const config = require('config');
const redis = require('redis');
const { USER_ROLES } = require('app.constants');

const router = new Router({
    prefix: '/subscriptions'
});
const mongoose = require('mongoose');

const CHANNEL = config.get('apiGateway.subscriptionAlertsChannelName');

const redisClient = redis.createClient({ url: config.get('redis.url') });

class SubscriptionsRouter {

    static getUser(ctx) {
        const { query, body } = ctx.request;

        let user;

        try {
            user = { ...(query.loggedUser ? JSON.parse(query.loggedUser) : {}), ...ctx.request.body.loggedUser };
        } catch (error) {
            ctx.throw(400, 'Invalid user token');
            return null;
        }

        if (body.fields && body.fields.loggedUser) {
            user = Object.assign(user, JSON.parse(body.fields.loggedUser));
        }
        return user;
    }

    static async getSubscription(ctx) {
        logger.debug(JSON.parse(ctx.request.query.loggedUser));
        const user = JSON.parse(ctx.request.query.loggedUser);
        const { id } = ctx.params;

        try {
            ctx.body = await SubscriptionService.getSubscriptionForUser(id, user.id);
        } catch (err) {
            logger.error(err);
        }
    }

    static async getSubscriptionData(ctx) {
        logger.debug(JSON.parse(ctx.request.query.loggedUser));
        const user = JSON.parse(ctx.request.query.loggedUser);
        const { id } = ctx.params;
        try {
            const subscription = await SubscriptionService.getSubscriptionForUser(id, user.id);
            ctx.body = { data: await DatasetService.processSubscriptionData(subscription.data.id) };
        } catch (err) {
            logger.error(err);
            ctx.throw(404, 'Subscription not found');
        }
    }

    static async getSubscriptions(ctx) {
        const user = JSON.parse(ctx.request.query.loggedUser);

        try {
            ctx.body = await SubscriptionService.getSubscriptionsForUser(user.id, ctx.query.application || 'gfw', ctx.query.env || 'production');
        } catch (err) {
            logger.error(err);
        }
    }

    static validateSubscription(subs) {
        if ((!subs.datasets || subs.datasets.length === 0) && (!subs.datasetsQuery || subs.datasetsQuery.length === 0)) {
            return 'Datasets or datasetsQuery required';
        }
        if (!subs.language) {
            return 'Language required';
        }
        if (!subs.resource) {
            return 'Resource required';
        }
        if (!subs.params) {
            return 'Params required';
        }
        return null;
    }

    static async createSubscription(ctx) {
        logger.info('Creating subscription with body', ctx.request.body);
        const message = SubscriptionsRouter.validateSubscription(ctx.request.body);
        if (message) {
            ctx.throw(400, message);
            return;
        }
        ctx.body = await SubscriptionService.createSubscription(ctx.request.body);
    }

    static async confirmSubscription(ctx) {
        logger.info('Confirming subscription by id %s', ctx.params.id);
        const subscription = await SubscriptionService.confirmSubscription(
            ctx.params.id
        );
        if (ctx.query.application && ctx.query.application === 'rw') {

            ctx.redirect(UrlService.flagshipUrlRW('/myrw/areas', subscription.data.attributes.env));
        } else {
            ctx.redirect(UrlService.flagshipUrl('/my_gfw/subscriptions?subscription_confirmed=true'));
        }
    }

    static async sendConfirmation(ctx) {
        logger.info('Resending confirmation email for subscription with id %s', ctx.params.id);
        const user = JSON.parse(ctx.request.query.loggedUser);
        const { id } = ctx.params;

        const subscription = await Subscription.where({
            _id: id,
            userId: user.id
        }).findOne();

        try {
            SubscriptionService.sendConfirmation(subscription);
            logger.info('Redirect to ', ctx.headers.referer);
            ctx.redirect(`${config.get('gfw.flagshipUrl')}/my_gfw/subscriptions`);
        } catch (err) {
            logger.error(err);
        }
    }

    static async updateSubscription(ctx) {
        logger.info('Update subscription by id %s', ctx.params.id);

        const message = SubscriptionsRouter.validateSubscription(ctx.request.body);
        if (message) {
            ctx.throw(400, message);
            return;
        }

        ctx.body = await SubscriptionService.updateSubscription(ctx.params.id, ctx.request.body);
    }

    static async unsubscribeSubscription(ctx) {
        logger.info('Unsubscribing subscription by id %s', ctx.params.id);
        const subscription = await SubscriptionService.deleteSubscriptionById(
            ctx.params.id
        );

        if (!subscription) {
            logger.error('Subscription not found');
            ctx.throw(404, 'Subscription not found');
            return;
        }
        if (ctx.query.redirect) {
            ctx.redirect(UrlService.flagshipUrl(
                '/my_gfw/subscriptions?unsubscription_confirmed=true'
            ));
            return;
        }
        ctx.body = subscription;
    }

    static async deleteSubscription(ctx) {
        logger.info('Deleting subscription by id %s', ctx.params.id);
        const subscription = await SubscriptionService.deleteSubscriptionById(
            ctx.params.id, JSON.parse(ctx.request.query.loggedUser).id
        );

        if (!subscription) {
            logger.error('Subscription not found');
            ctx.throw(404, 'Subscription not found');
            return;
        }

        ctx.body = subscription;
    }

    static async notifyUpdates(ctx) {
        const { dataset } = ctx.params;
        logger.info(`Notify '${dataset}' was updated`);
        const result = await UpdateService.checkUpdated(dataset);
        logger.info(`Checking if '${dataset}' was updated`);

        if (result.updated) {
            redisClient.publish(CHANNEL, JSON.stringify({
                layer_slug: dataset,
                begin_date: new Date(result.beginDate),
                end_date: new Date(result.endDate)
            }));
            ctx.body = `Dataset:${dataset} was updated`;
        } else {
            logger.info(`${dataset} was not updated`);
            ctx.body = `Dataset:${dataset} wasn't updated`;
        }
    }

    static async statistics(ctx) {
        logger.info('Obtaining statistics');
        ctx.assert(ctx.query.start, 400, 'Start date required');
        ctx.assert(ctx.query.end, 400, 'End date required');
        ctx.body = await StatisticsService.getStatistics(new Date(ctx.query.start), new Date(ctx.query.end));
    }

    static async statisticsGroup(ctx) {
        logger.info('Obtaining statistics group');
        ctx.assert(ctx.query.start, 400, 'Start date required');
        ctx.assert(ctx.query.end, 400, 'End date required');
        ctx.assert(ctx.query.application, 400, 'Application required');
        ctx.body = await StatisticsService.infoGroupSubscriptions(new Date(ctx.query.start), new Date(ctx.query.end), ctx.query.application);
    }

    static async checkHook(ctx) {
        logger.info('Checking hook');
        const info = ctx.request.body;
        const slug = info.slug ? info.slug : 'viirs-active-fires';
        const mock = MockService.getMock(slug);
        if (info.type === 'EMAIL') {
            mailService.sendMail('fires-notification-en', mock, [{ email: info.content }]);
        } else {
            try {
                await request({
                    uri: info.content,
                    method: 'POST',
                    body: mock,
                    json: true
                });
            } catch (e) {
                throw new GenericError(400, `${e.message}`);
            }
        }
        ctx.body = 'ok';
    }

    static async statisticsByUser(ctx) {
        logger.info('Obtaining statistics by user');
        ctx.assert(ctx.query.start, 400, 'Start date required');
        ctx.assert(ctx.query.end, 400, 'End date required');
        ctx.assert(ctx.query.application, 400, 'Application required');
        ctx.body = await StatisticsService.infoByUserSubscriptions(new Date(ctx.query.start), new Date(ctx.query.end), ctx.query.application);
    }

    static async findByIds(ctx) {
        logger.info(`[SubscriptionsRouter] Getting all subscriptions with ids`, ctx.request.body);
        if (ctx.request && ctx.request.body && ctx.request.body.ids && ctx.request.body.ids.length > 0) {
            const subscriptions = await SubscriptionService.getSubscriptionsByIds(ctx.request.body.ids);
            ctx.body = { data: subscriptions };
        } else {
            ctx.body = { data: [] };
        }
    }

    static async findUserSubscriptions(ctx) {
        const { userId } = ctx.params;
        const application = ctx.query.application || 'gfw';
        const env = ctx.query.env || 'production';
        logger.info(`[SubscriptionsRouter] Getting all subscriptions for user with id`, userId);
        ctx.body = await SubscriptionService.getSubscriptionsForUser(userId, application, env);
    }

}

const isAdmin = async (ctx, next) => {
    const loggedUser = SubscriptionsRouter.getUser(ctx);

    if (!loggedUser || USER_ROLES.indexOf(loggedUser.role) === -1) {
        ctx.throw(401, 'Not authorized');
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

const subscriptionExists = (isForUser) => async (ctx, next) => {
    const { id } = ctx.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        ctx.throw(400, 'ID is not valid');
    }

    let subscription;
    let user = ctx.request.query.loggedUser || ctx.request.body.loggedUser;
    if (typeof user === 'string') {
        user = JSON.parse(user);
    }

    if (isForUser && user.id !== 'microservice') {
        subscription = await Subscription.findOne({
            _id: id,
            userId: user.id,
        });
    } else {
        subscription = await Subscription.findById(id);
    }

    if (!subscription) {
        ctx.throw(404, 'Subscription not found');
        return;
    }
    await next();
};

const checkMicroservice = (ctx) => {
    const loggedUser = SubscriptionsRouter.getUser(ctx);
    return loggedUser.id === 'microservice';
};

const hasLoggedUser = (ctx) => {
    const loggedUser = SubscriptionsRouter.getUser(ctx);
    return loggedUser && USER_ROLES.indexOf(loggedUser.role) !== -1;
};

const checkValidLoggedUser = (ctx) => {
    const loggedUser = SubscriptionsRouter.getUser(ctx);
    return typeof loggedUser === 'object' && loggedUser.role;
};

const isLoggedUserRequired = async (ctx, next) => {
    if (!hasLoggedUser(ctx)) {
        ctx.throw(401, 'Not authorized');
        return;
    }

    if (!checkValidLoggedUser(ctx)) {
        ctx.throw(401, 'Not valid loggedUser, it should be json a valid object string in query');
        return;
    }

    await next();
};

const isMicroservice = async (ctx, next) => {
    if (!checkMicroservice(ctx)) {
        ctx.throw(401, 'Not authorized');
        return;
    }

    await next();
};

const loggedUserOrMicroserviceAuth = async (ctx, next) => {
    if (!(hasLoggedUser(ctx) || checkValidLoggedUser(ctx)) && !checkMicroservice(ctx)) {
        ctx.throw(401, 'Not authorized');
        return;
    }

    await next();
};

router.post('/', SubscriptionsRouter.createSubscription);
router.get('/', isLoggedUserRequired, SubscriptionsRouter.getSubscriptions);
router.get('/statistics', isAdmin, SubscriptionsRouter.statistics);
router.get('/statistics-group', isAdmin, SubscriptionsRouter.statisticsGroup);
router.get('/statistics-by-user', isAdmin, SubscriptionsRouter.statisticsByUser);
router.get('/:id', isLoggedUserRequired, subscriptionExists(true), SubscriptionsRouter.getSubscription); // not done
router.get('/:id/data', isLoggedUserRequired, subscriptionExists(true), SubscriptionsRouter.getSubscriptionData);
router.get('/:id/confirm', subscriptionExists(), SubscriptionsRouter.confirmSubscription);
router.get('/:id/send_confirmation', isLoggedUserRequired, subscriptionExists(true), SubscriptionsRouter.sendConfirmation);
router.get('/:id/unsubscribe', subscriptionExists(), SubscriptionsRouter.unsubscribeSubscription);
router.patch('/:id', loggedUserOrMicroserviceAuth, subscriptionExists(true), SubscriptionsRouter.updateSubscription);
router.delete('/:id', loggedUserOrMicroserviceAuth, subscriptionExists(true), SubscriptionsRouter.deleteSubscription);
router.post('/notify-updates/:dataset', SubscriptionsRouter.notifyUpdates);
router.post('/check-hook', SubscriptionsRouter.checkHook);
router.get('/user/:userId', isMicroservice, SubscriptionsRouter.findUserSubscriptions);
router.post('/find-by-ids', isMicroservice, SubscriptionsRouter.findByIds);

module.exports = router;
