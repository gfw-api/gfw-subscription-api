const Router = require('koa-router');
const UrlService = require('services/urlService');
const logger = require('logger');
const coRequest = require('co-request');
const Subscription = require('models/subscription');
const SubscriptionService = require('services/subscriptionService');
const UpdateService = require('services/updateService');
const DatasetService = require('services/datasetService');
const StatisticsService = require('services/statisticsService');
const mailService = require('services/mailService');
const MockService = require('services/mockService');
const GenericError = require('errors/genericError');
const config = require('config');
const { get } = require('lodash');

const router = new Router({
    prefix: '/subscriptions'
});
const mongoose = require('mongoose');

const CHANNEL = 'subscription_alerts';
const AsyncClient = require('vizz.async-client');

let asyncClient = new AsyncClient(AsyncClient.REDIS, {
    url: `redis://${config.get('redisLocal.host')}:${config.get('redisLocal.port')}`
});
asyncClient = asyncClient.toChannel(CHANNEL);

class SubscriptionsRouter {

    static* getSubscription() {
        logger.debug(JSON.parse(this.request.query.loggedUser));
        const user = JSON.parse(this.request.query.loggedUser);
        const { id } = this.params;

        try {
            this.body = yield SubscriptionService.getSubscriptionForUser(id, user.id);
        } catch (err) {
            logger.error(err);
        }
    }

    static* getSubscriptionData() {
        logger.debug(JSON.parse(this.request.query.loggedUser));
        const user = JSON.parse(this.request.query.loggedUser);
        const { id } = this.params;
        try {
            const subscription = yield SubscriptionService.getSubscriptionForUser(id, user.id);
            this.body = { data: yield DatasetService.processSubscriptionData(subscription.data.id) };
        } catch (err) {
            logger.error(err);
            this.throw(404, 'Subscription not found');
        }
    }

    static* getSubscriptions() {
        const user = JSON.parse(this.request.query.loggedUser);

        try {
            this.body = yield SubscriptionService.getSubscriptionsForUser(user.id, this.query.application || 'gfw', this.query.env || 'production');
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

    static* createSubscription() {
        logger.info('Creating subscription with body', this.request.body);
        try {
            const message = SubscriptionsRouter.validateSubscription(this.request.body);
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

    static* confirmSubscription() {
        logger.info('Confirming subscription by id %s', this.params.id);
        try {
            const subscription = yield SubscriptionService.confirmSubscription(
                this.params.id
            );
            if (this.query.application && this.query.application === 'rw') {

                this.redirect(UrlService.flagshipUrlRW('/myrw/areas', subscription.data.attributes.env));
            } else {
                this.redirect(UrlService.flagshipUrl('/my_gfw/subscriptions?subscription_confirmed=true'));
            }
        } catch (err) {
            logger.error(err);
        }
    }

    static* sendConfirmation() {
        logger.info('Resending confirmation email for subscription with id %s', this.params.id);
        const user = JSON.parse(this.request.query.loggedUser);
        const { id } = this.params;

        const subscription = yield Subscription.where({
            _id: id,
            userId: user.id
        }).findOne();

        try {
            SubscriptionService.sendConfirmation(subscription);
            logger.info('Redirect to ', this.headers.referer);
            this.redirect(`${config.get('gfw.flagshipUrl')}/my_gfw/subscriptions`);
        } catch (err) {
            logger.error(err);
        }
    }

    static* updateSubscription() {
        logger.info('Update subscription by id %s', this.params.id);

        try {
            const message = SubscriptionsRouter.validateSubscription(this.request.body);
            if (message) {
                this.throw(400, message);
                return;
            }

            this.body = yield SubscriptionService.updateSubscription(
                this.params.id, this.request.body.loggedUser.id, this.request.body
            );
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }

    static* unsubscribeSubscription() {
        logger.info('Unsubscribing subscription by id %s', this.params.id);
        const subscription = yield SubscriptionService.deleteSubscriptionById(
            this.params.id
        );

        if (!subscription) {
            logger.error('Subscription not found');
            this.throw(404, 'Subscription not found');
            return;
        }
        if (this.query.redirect) {
            this.redirect(UrlService.flagshipUrl(
                '/my_gfw/subscriptions?unsubscription_confirmed=true'
            ));
            return;
        }
        this.body = subscription;
    }

    static* deleteSubscription() {
        logger.info('Deleting subscription by id %s', this.params.id);
        const subscription = yield SubscriptionService.deleteSubscriptionById(
            this.params.id, JSON.parse(this.request.query.loggedUser).id
        );

        if (!subscription) {
            logger.error('Subscription not found');
            this.throw(404, 'Subscription not found');
            return;
        }

        this.body = subscription;
    }

    static* notifyUpdates() {
        const { dataset } = this.params;
        logger.info(`Notify '${dataset}' was updated`);
        const result = yield UpdateService.checkUpdated(dataset);
        logger.info(`Checking if '${dataset}' was updating`);

        if (result.updated) {
            asyncClient.emit(JSON.stringify({
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

    static* statistics() {
        logger.info('Obtaining statistics');
        this.assert(this.query.start, 400, 'Start date required');
        this.assert(this.query.end, 400, 'End date required');
        this.body = yield StatisticsService.getStatistics(new Date(this.query.start), new Date(this.query.end));
    }

    static* statisticsGroup() {
        logger.info('Obtaining statistics group');
        this.assert(this.query.start, 400, 'Start date required');
        this.assert(this.query.end, 400, 'End date required');
        this.assert(this.query.application, 400, 'Application required');
        this.body = yield StatisticsService.infoGroupSubscriptions(new Date(this.query.start), new Date(this.query.end), this.query.application);
    }

    static* checkHook() {
        logger.info('Checking hook');
        const info = this.request.body;
        const slug = info.slug ? info.slug : 'viirs-active-fires';
        const mock = yield MockService.getMock(slug);
        if (info.type === 'EMAIL') {
            mailService.sendMail('fires-notification-en', mock, [{ email: info.content }]);
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

    static* statisticsByUser() {
        logger.info('Obtaining statistics by user');
        this.assert(this.query.start, 400, 'Start date required');
        this.assert(this.query.end, 400, 'End date required');
        this.assert(this.query.application, 400, 'Application required');
        this.body = yield StatisticsService.infoByUserSubscriptions(new Date(this.query.start), new Date(this.query.end), this.query.application);
    }

}

const isAdmin = function* (next) {
    let loggedUser = this.request.body ? this.request.body.loggedUser : null;
    if (!loggedUser) {
        loggedUser = this.query.loggedUser ? JSON.parse(this.query.loggedUser) : null;
    }
    if (!loggedUser) {
        this.throw(401, 'Not authorized');
        return;
    }
    if (loggedUser.role !== 'ADMIN') {
        this.throw(403, 'Not authorized');
        return;
    }
    if (!loggedUser.extraUserData || !loggedUser.extraUserData.apps || loggedUser.extraUserData.apps.indexOf('gfw') === -1) {
        this.throw(403, 'Not authorized');
        return;
    }
    yield next;
};

const existSubscription = isForUser => function* (next) {
    const { id } = this.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        this.throw(400, 'ID is not valid');
    }

    let subscription;

    if (isForUser) {
        let user = this.request.query.loggedUser || this.request.body.loggedUser;

        if (typeof user === 'string') {
            user = JSON.parse(user);
        }

        subscription = yield Subscription.findOne({
            _id: id,
            userId: user.id,
        });
    } else {
        subscription = yield Subscription.findById(id);
    }

    if (!subscription) {
        this.throw(404, 'Subscription not found');
        return;
    }
    yield next;
};

const isLoggedUserRequired = (from = 'query') => function* (next) {
    const loggedUser = get(this.request[from], 'loggedUser');

    if (!loggedUser) {
        this.throw(401, 'Not authorized');
        return;
    }

    if (from === 'query') {
        try {
            const parsedLoggedUser = JSON.parse(loggedUser);
            if (typeof parsedLoggedUser !== 'object') {
                this.throw(401, 'Not valid loggedUser, it should be json a valid object string in query');
            } else if (!parsedLoggedUser.role) {
                this.throw(401, 'Not valid loggedUser, it should be json a valid object string in query');
            }
        } catch (err) {
            if (err.status && err.message) {
                this.throw(err.status, err.message);
            } else {
                this.throw(401, 'Not valid loggedUser, it should be a json string in query');
            }
        }
    }

    yield next;
};

router.post('/', SubscriptionsRouter.createSubscription);
router.get('/', isLoggedUserRequired(), SubscriptionsRouter.getSubscriptions);
router.get('/:id', isLoggedUserRequired(), existSubscription(true), SubscriptionsRouter.getSubscription); // not done
router.get('/:id/data', isLoggedUserRequired(), existSubscription(true), SubscriptionsRouter.getSubscriptionData);
router.get('/:id/confirm', existSubscription(), SubscriptionsRouter.confirmSubscription);
router.get('/:id/send_confirmation', isLoggedUserRequired(), existSubscription(true), SubscriptionsRouter.sendConfirmation);
router.get('/:id/unsubscribe', existSubscription(), SubscriptionsRouter.unsubscribeSubscription);
router.patch('/:id', isLoggedUserRequired('body'), existSubscription(true), SubscriptionsRouter.updateSubscription);
router.delete('/:id', isLoggedUserRequired(), existSubscription(true), SubscriptionsRouter.deleteSubscription);
router.post('/notify-updates/:dataset', SubscriptionsRouter.notifyUpdates);
router.get('/statistics', isAdmin, SubscriptionsRouter.statistics);
router.get('/statistics-group', isAdmin, SubscriptionsRouter.statisticsGroup);
router.get('/statistics-by-user', isAdmin, SubscriptionsRouter.statisticsByUser);
router.post('/check-hook', SubscriptionsRouter.checkHook);

module.exports = router;
