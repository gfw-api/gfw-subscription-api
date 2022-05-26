import chai from 'chai';
import nock from 'nock';

import Subscription from 'models/subscription';

import {
    createSubscription,
    createSubscriptionContent,
    createURLSubscription,
    createURLSubscriptionCallMock,
    mockGetUserFromToken
} from './utils/helpers';
import { ROLES } from './utils/test.constants';
import { getTestServer } from './utils/test-server';
import {
    bootstrapEmailNotificationTests,
    validateCommonNotificationParams,
    validateCustomMapURLs, validateGladAll, validateGladRadd
} from './utils/helpers/email-notifications';
import { mockGLADAlertsGeostoreQuery, mockVIIRSAlertsGeostoreQuery } from './utils/mock';
import { createGLADAllGeostoreURLSubscriptionBody, mockGLADAllGeostoreQuery } from './utils/mocks/gladAll.mocks';
import { createMonthlySummaryGeostoreURLSubscriptionBody } from './utils/mocks/monthlySummary.mocks';
import { createGLADLGeostoreURLSubscriptionBody, mockGLADLGeostoreQuery } from './utils/mocks/gladL.mocks';
import { createGLADS2GeostoreURLSubscriptionBody, mockGLADS2GeostoreQuery } from './utils/mocks/gladS2.mocks';
import { createGLADRADDGeostoreURLSubscriptionBody, mockGLADRADDGeostoreQuery } from './utils/mocks/gladRadd.mocks';
import moment from 'moment';
import { createGLADAlertsGeostoreURLSubscriptionBody } from './utils/mocks/glad.mocks';
import { createViirsFireAlertsGeostoreURLSubscriptionBody } from './utils/mocks/viirs.mocks';
import AlertQueue from '../../src/queues/alert.queue';
import config from 'config';
import { createClient, RedisClientType } from 'redis';

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
        const noTokenResponse = await requester.post(`/api/v1/subscriptions/test-alert`).send();
        noTokenResponse.status.should.equal(401);

        mockGetUserFromToken(ROLES.USER);

        const userResponse = await requester.post(`/api/v1/subscriptions/test-alert`)
            .set('Authorization', `Bearer abcd`)
            .send({});
        userResponse.status.should.equal(403);

        mockGetUserFromToken(ROLES.MANAGER);

        const managerResponse = await requester.post(`/api/v1/subscriptions/test-alert`)
            .set('Authorization', `Bearer abcd`)
            .send({});
        managerResponse.status.should.equal(403);
    });

    it('Validates the provided subscriptionId, rejecting if not provided', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        const res = await requester.post(`/api/v1/subscriptions/test-alert`)
            .set('Authorization', `Bearer abcd`)
            .send({
                email: 'test.user@wri.org',
            });
        res.status.should.equal(400);
    });

    it('Testing an URL alert with no type change calls the custom url', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        const subscription = await new Subscription(createURLSubscription(
            ROLES.USER.id,
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

        mockGLADAlertsGeostoreQuery();
        createURLSubscriptionCallMock(createGLADAlertsGeostoreURLSubscriptionBody(subscription, beginDate, endDate));
        (await requester.post(`/api/v1/subscriptions/test-alert`)
            .set('Authorization', `Bearer abcd`)
            .send(testUrlBody)).status.should.equal(200);
    });

    it('Testing an EMAIL alert with URL type change calls the custom url', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        const subscription = await createSubscription(
            ROLES.USER.id,
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

        mockGLADAlertsGeostoreQuery();
        createURLSubscriptionCallMock(createGLADAlertsGeostoreURLSubscriptionBody(subscription, beginDate, endDate));
        (await requester.post(`/api/v1/subscriptions/test-alert`)
            .set('Authorization', `Bearer abcd`)
            .send(testUrlBody)).status.should.equal(200);
    });

    it('Testing an URL alert with EMAIL type change emails the custom address', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        const subscription = await new Subscription(createURLSubscription(
            ROLES.USER.id,
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

        mockGLADAlertsGeostoreQuery();
        (await requester.post(`/api/v1/subscriptions/test-alert`)
            .set('Authorization', `Bearer abcd`)
            .send(testUrlBody)).status.should.equal(200);

        return consumerPromise;
    });

    it('Testing an EMAIL alert with no type change emails the custom address', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        const subscription = await createSubscription(
            ROLES.USER.id,
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

        mockGLADAlertsGeostoreQuery();
        (await requester.post(`/api/v1/subscriptions/test-alert`)
            .set('Authorization', `Bearer abcd`)
            .send(testUrlBody)).status.should.equal(200);

        return consumerPromise;
    });

    afterEach(async () => {
        await redisClient.unsubscribe(CHANNEL);

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
    });
});
