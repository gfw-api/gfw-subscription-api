import chai from 'chai';
import nock from 'nock';
import Subscription, { ISubscription } from 'models/subscription';
import {
    createSubscription,
    createURLSubscription,
    createURLSubscriptionCallMock, mockValidateRequestWithApiKey, mockValidateRequestWithApiKeyAndUserToken,
} from './utils/helpers';
import { USERS } from './utils/test.constants';
import { getTestServer } from './utils/test-server';
import {
    bootstrapEmailNotificationTests,
    validateCommonNotificationParams,
} from './utils/helpers/email-notifications';
import { createGLADAllGeostoreURLSubscriptionBody, mockGLADAllGeostoreQuery } from './utils/mocks/gladAll.mocks';
import { createMonthlySummaryGeostoreURLSubscriptionBody } from './utils/mocks/monthlySummary.mocks';
import { createGLADLGeostoreURLSubscriptionBody, mockGLADLGeostoreQuery } from './utils/mocks/gladL.mocks';
import { createGLADS2GeostoreURLSubscriptionBody, mockGLADS2GeostoreQuery } from './utils/mocks/gladS2.mocks';
import { createGLADRADDGeostoreURLSubscriptionBody, mockGLADRADDGeostoreQuery } from './utils/mocks/gladRadd.mocks';
import moment from 'moment';
import { createGLADAlertsGeostoreURLSubscriptionBody } from './utils/mocks/glad.mocks';
import { createViirsFireAlertsGeostoreURLSubscriptionBody } from './utils/mocks/viirs.mocks';
import config from 'config';
import { createClient, RedisClientType } from 'redis';
import { mockVIIRSAlertsGeostoreQuery } from './utils/mock';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();

let requester: ChaiHttp.Agent;

const CHANNEL: string = config.get('apiGateway.queueName');
let redisClient: RedisClientType;

describe('Test alerts spec', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }
        moment.locale('en');
        requester = await getTestServer();

        redisClient = createClient({ url: config.get('redis.url') });
        await redisClient.connect();
    });

    it('Testing alerts is only allowed for ADMIN users, failing with 401 Unauthorized otherwise', async () => {
        mockValidateRequestWithApiKey({});
        const noTokenResponse = await requester
            .post(`/api/v1/subscriptions/test-alert`)
            .set('x-api-key', 'api-key-test')
            .send();
        noTokenResponse.status.should.equal(401);

        mockValidateRequestWithApiKeyAndUserToken({});

        const userResponse = await requester.post(`/api/v1/subscriptions/test-alert`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send({});
        userResponse.status.should.equal(403);

        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MANAGER });

        const managerResponse = await requester.post(`/api/v1/subscriptions/test-alert`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send({});
        managerResponse.status.should.equal(403);
    });

    it('Validates the provided subscriptionId, rejecting if not provided', async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });

        const res = await requester.post(`/api/v1/subscriptions/test-alert`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send({
                email: 'test.user@wri.org',
            });
        res.status.should.equal(400);
    });

    it('Testing an URL alert with no type change calls the custom url', async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });

        const subscription = await new Subscription(createURLSubscription(
            USERS.USER.id,
            'glad-alerts',
            {
                params: { geostore: '423e5dfb0448e692f97b590c61f45f22' },
                resource: {
                    content: 'http://tomato-url.com/notify',
                    type: 'URL'
                },
            },
        )).save();

        const testUrlBody = {
            url: 'http://potato-url.com/notify',
            subId: subscription.id,
            alert: 'glad-alerts'
        };

        const { beginDate, endDate } = bootstrapEmailNotificationTests();

        mockGLADLGeostoreQuery();
        createURLSubscriptionCallMock(createGLADAlertsGeostoreURLSubscriptionBody(subscription, beginDate, endDate));
        (await requester.post(`/api/v1/subscriptions/test-alert`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send(testUrlBody)).status.should.equal(200);
    });

    it('Testing an EMAIL alert with URL type change calls the custom url', async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });

        const subscription = await createSubscription(
            USERS.USER.id,
            {
                datasets: ['glad-alerts'],
                params: { geostore: '423e5dfb0448e692f97b590c61f45f22' },
                resource: {
                    content: 'address@wri.org',
                    type: 'EMAIL'
                },
            },
        );

        const testUrlBody = {
            url: 'http://potato-url.com/notify',
            subId: subscription.id,
            alert: 'glad-alerts',
            type: 'url'
        };

        const { beginDate, endDate } = bootstrapEmailNotificationTests();

        mockGLADLGeostoreQuery();
        createURLSubscriptionCallMock(createGLADAlertsGeostoreURLSubscriptionBody(subscription, beginDate, endDate));
        (await requester.post(`/api/v1/subscriptions/test-alert`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send(testUrlBody)).status.should.equal(200);
    });

    it('Testing an URL alert with EMAIL type change emails the custom address', async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });

        const subscription = await new Subscription(createURLSubscription(
            USERS.USER.id,
            'glad-alerts',
            {
                params: { geostore: '423e5dfb0448e692f97b590c61f45f22' },
                resource: {
                    content: 'http://tomato-url.com/notify',
                    type: 'URL'
                },
            },
        )).save();

        const testUrlBody = {
            email: 'subscription-recipient@vizzuality.com',
            subId: subscription.id,
            alert: 'glad-alerts',
            type: 'email'
        };

        const { beginDate, endDate } = bootstrapEmailNotificationTests();

        let expectedQueueMessageCount = 1;

        const validateMailQueuedMessages = (resolve: (value: (PromiseLike<unknown> | unknown)) => void) => async (message: string) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'glad-updated-notification-en': {
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscription);
                    break;
                }
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }

            expectedQueueMessageCount -= 1;

            if (expectedQueueMessageCount < 0) {
                throw new Error(`Unexpected message count - expectedQueueMessageCount:${expectedQueueMessageCount}`);
            }

            if (expectedQueueMessageCount === 0) {
                resolve(null);
            }
        };

        const consumerPromise = new Promise((resolve) => {
            redisClient.subscribe(CHANNEL, validateMailQueuedMessages(resolve));
        })

        mockGLADLGeostoreQuery();
        (await requester.post(`/api/v1/subscriptions/test-alert`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send(testUrlBody)).status.should.equal(200);

        return consumerPromise;
    });

    it('Testing an EMAIL alert with no type change emails the custom address', async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });

        const subscription = await createSubscription(
            USERS.USER.id,
            {
                datasets: ['glad-alerts'],
                params: { geostore: '423e5dfb0448e692f97b590c61f45f22' },
                resource: {
                    content: 'modified@wri.org',
                    type: 'EMAIL'
                },
            },
        );

        const testUrlBody = {
            email: 'subscription-recipient@vizzuality.com',
            subId: subscription.id,
            alert: 'glad-alerts'
        };

        const { beginDate, endDate } = bootstrapEmailNotificationTests();

        let expectedQueueMessageCount = 1;

        const validateMailQueuedMessages = (resolve: (value: (PromiseLike<unknown> | unknown)) => void) => async (message: string) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'glad-updated-notification-en': {
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscription);
                    break;
                }
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }

            expectedQueueMessageCount -= 1;

            if (expectedQueueMessageCount < 0) {
                throw new Error(`Unexpected message count - expectedQueueMessageCount:${expectedQueueMessageCount}`);
            }

            if (expectedQueueMessageCount === 0) {
                resolve(null);
            }
        };

        const consumerPromise = new Promise((resolve) => {
            redisClient.subscribe(CHANNEL, validateMailQueuedMessages(resolve));
        })

        mockGLADLGeostoreQuery();
        (await requester.post(`/api/v1/subscriptions/test-alert`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send(testUrlBody)).status.should.equal(200);

        return consumerPromise;
    });

    describe('Email alerts', () => {
        it('Validates the provided email alert, rejecting everything else other than "glad-alerts", "viirs-active-fires", "monthly-summary" or "glad-all', async () => {
            const subscription = await createSubscription(
                USERS.USER.id,
                {
                    datasets: ['glad-alerts'],
                    params: { geostore: '423e5dfb0448e692f97b590c61f45f22' },
                    resource: {
                        content: 'modified@wri.org',
                        type: 'EMAIL'
                    },
                },
            );


            mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });
            mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });
            mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });
            mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });
            mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });
            mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });
            mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });
            mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });

            const testBody = {
                email: 'foo@bar.com',
                subId: subscription.id,
            };

            (await requester.post(`/api/v1/subscriptions/test-alert`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .send({ ...testBody, alert: 'glad-alerts' })).status.should.equal(200);

            (await requester.post(`/api/v1/subscriptions/test-alert`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .send({ ...testBody, alert: 'viirs-active-fires' })).status.should.equal(200);

            (await requester.post(`/api/v1/subscriptions/test-alert`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .send({ ...testBody, alert: 'monthly-summary' })).status.should.equal(200);

            (await requester.post(`/api/v1/subscriptions/test-alert`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .send({ ...testBody, alert: 'glad-all' })).status.should.equal(200);

            (await requester.post(`/api/v1/subscriptions/test-alert`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .send({ ...testBody, alert: 'glad-l' })).status.should.equal(200);

            (await requester.post(`/api/v1/subscriptions/test-alert`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .send({ ...testBody, alert: 'glad-s2' })).status.should.equal(200);

            (await requester.post(`/api/v1/subscriptions/test-alert`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .send({ ...testBody, alert: 'glad-radd' })).status.should.equal(200);

            (await requester.post(`/api/v1/subscriptions/test-alert`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .send({ ...testBody, alert: 'other' })).status.should.equal(400);
        });

        it('Testing an email alert for GLAD email alerts for a language that\'s not EN should return a 200 OK response', async () => {
            mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });

            const subscription: ISubscription = await createSubscription(USERS.ADMIN.id, { datasets: ['glad-alerts'] });
            process.on('unhandledRejection', (args) => should.fail(JSON.stringify(args)));

            mockGLADLGeostoreQuery();

            const body = {
                email: 'test.user@wri.org',
                subId: subscription._id,
                alert: 'glad-alerts',
                language: 'fr',
            };

            let expectedQueueMessageCount = 1;

            const validateMailQueuedMessages = (resolve: (value: (PromiseLike<unknown> | unknown)) => void) => async (message: string) => {
                const jsonMessage = JSON.parse(message);
                jsonMessage.should.have.property('template');
                switch (jsonMessage.template) {

                    case 'glad-updated-notification-fr':
                        jsonMessage.should.have.property('sender').and.equal('gfw');
                        jsonMessage.should.have.property('data').and.be.a('object');

                        jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
                        jsonMessage.recipients[0].should.be.an('object')
                            .and.have.property('address')
                            .and.equal(body.email);
                        break;
                    default:
                        should.fail('Unsupported message type: ', jsonMessage.template);
                        break;

                }

                expectedQueueMessageCount -= 1;

                if (expectedQueueMessageCount < 0) {
                    throw new Error(`Unexpected message count - expectedQueueMessageCount:${expectedQueueMessageCount}`);
                }

                if (expectedQueueMessageCount === 0) {
                    moment.locale('en');
                    resolve(null);
                }
            };

            const consumerPromise = new Promise((resolve) => {
                redisClient.subscribe(CHANNEL, validateMailQueuedMessages(resolve));
            })

            const response = await requester.post(`/api/v1/subscriptions/test-alert`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .send(body);
            response.status.should.equal(200);
            response.body.should.have.property('success').and.equal(true);

            return consumerPromise;
        });
    });

    describe('Webhook alerts', () => {

        it('Validates the provided alert, rejecting everything else other than "glad-alerts", "viirs-active-fires", "monthly-summary" or "glad-all', async () => {
            for (const i of [...Array(8).keys()]) {
                mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });
            }

            const subscriptionOne = await new Subscription(createURLSubscription(
                USERS.USER.id,
                'glad-alerts',
                {
                    params: { geostore: '423e5dfb0448e692f97b590c61f45f22' },
                    resource: {
                        content: 'http://tomato-url.com/notify',
                        type: 'URL'
                    },
                },
            )).save();

            const testBody = {
                url: 'http://potato-url.com/notify',
                subId: subscriptionOne.id,
            };

            const { beginDate, endDate } = bootstrapEmailNotificationTests();

            mockGLADLGeostoreQuery();
            createURLSubscriptionCallMock(createGLADAlertsGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));
            (await requester.post(`/api/v1/subscriptions/test-alert`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .send({ ...testBody, alert: 'glad-alerts' })).status.should.equal(200);

            mockVIIRSAlertsGeostoreQuery(2);
            createURLSubscriptionCallMock(createViirsFireAlertsGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));
            (await requester.post(`/api/v1/subscriptions/test-alert`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .send({ ...testBody, alert: 'viirs-active-fires' })).status.should.equal(200);

            mockVIIRSAlertsGeostoreQuery(2);
            mockGLADLGeostoreQuery(2);
            createURLSubscriptionCallMock(createMonthlySummaryGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));
            (await requester.post(`/api/v1/subscriptions/test-alert`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .send({ ...testBody, alert: 'monthly-summary' })).status.should.equal(200);

            mockGLADAllGeostoreQuery();
            createURLSubscriptionCallMock(createGLADAllGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));
            (await requester.post(`/api/v1/subscriptions/test-alert`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .send({ ...testBody, alert: 'glad-all' })).status.should.equal(200);

            mockGLADLGeostoreQuery();
            createURLSubscriptionCallMock(createGLADLGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));
            (await requester.post(`/api/v1/subscriptions/test-alert`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .send({ ...testBody, alert: 'glad-l' })).status.should.equal(200);

            mockGLADS2GeostoreQuery();
            createURLSubscriptionCallMock(createGLADS2GeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));
            (await requester.post(`/api/v1/subscriptions/test-alert`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .send({ ...testBody, alert: 'glad-s2' })).status.should.equal(200);

            mockGLADRADDGeostoreQuery();
            createURLSubscriptionCallMock(createGLADRADDGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));
            (await requester.post(`/api/v1/subscriptions/test-alert`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .send({ ...testBody, alert: 'glad-radd' })).status.should.equal(200);

            (await requester.post(`/api/v1/subscriptions/test-alert`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .send({ ...testBody, alert: 'other' })).status.should.equal(400);
        });

        it('Testing an webhook alert for GLAD alerts for a language that\'s not EN should return a 200 OK response', async () => {
            mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });

            const subscription = await new Subscription(createURLSubscription(
                USERS.USER.id,
                'glad-alerts',
                {
                    params: { geostore: '423e5dfb0448e692f97b590c61f45f22' },
                    resource: {
                        content: 'http://tomato-url.com/notify',
                        type: 'URL'
                    },
                    language: 'fr'
                },
            )).save();

            const { beginDate, endDate } = bootstrapEmailNotificationTests();

            mockGLADLGeostoreQuery();

            subscription.language = 'en';
            createURLSubscriptionCallMock(createGLADAlertsGeostoreURLSubscriptionBody(subscription, beginDate, endDate));

            const response = await requester.post(`/api/v1/subscriptions/test-alert`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .send({
                    url: 'http://potato-url.com/notify',
                    subId: subscription._id,
                    alert: 'glad-alerts',
                    language: 'en',
                });

            response.status.should.equal(200);
            response.body.should.have.property('success').and.equal(true);
        });
    });


    afterEach(async () => {
        await redisClient.unsubscribe(CHANNEL);

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
    });
});
