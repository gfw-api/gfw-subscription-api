import chai from 'chai';
import nock from 'nock';

import Subscription  from 'models/subscription';

import {
    createURLSubscription,
    createURLSubscriptionCallMock,
    mockGetUserFromToken
} from './utils/helpers';
import { ROLES } from './utils/test.constants';
import { getTestServer } from './utils/test-server';
import { bootstrapEmailNotificationTests } from './utils/helpers/email-notifications';
import { mockGLADAlertsGeostoreQuery, mockVIIRSAlertsGeostoreQuery } from './utils/mock';
import { createGLADAllGeostoreURLSubscriptionBody, mockGLADAllGeostoreQuery } from './utils/mocks/gladAll.mocks';
import { createMonthlySummaryGeostoreURLSubscriptionBody } from './utils/mocks/monthlySummary.mocks';
import { createGLADLGeostoreURLSubscriptionBody, mockGLADLGeostoreQuery } from './utils/mocks/gladL.mocks';
import { createGLADS2GeostoreURLSubscriptionBody, mockGLADS2GeostoreQuery } from './utils/mocks/gladS2.mocks';
import { createGLADRADDGeostoreURLSubscriptionBody, mockGLADRADDGeostoreQuery } from './utils/mocks/gladRadd.mocks';
import moment from 'moment';
import { createGLADAlertsGeostoreURLSubscriptionBody } from './utils/mocks/glad.mocks';
import { createViirsFireAlertsGeostoreURLSubscriptionBody } from './utils/mocks/viirs.mocks';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

chai.should();

let requester: ChaiHttp.Agent;


describe('Test webhook alerts spec', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }
        moment.locale('en');
        requester = await getTestServer();
    });

    it('Testing webhook alerts is only allowed for ADMIN users, failing with 401 Unauthorized otherwise', async () => {
        const noTokenResponse = await requester.post(`/api/v1/subscriptions/test-webhook-alert`).send();
        noTokenResponse.status.should.equal(401);

        mockGetUserFromToken(ROLES.USER);

        const userResponse = await requester.post(`/api/v1/subscriptions/test-webhook-alert`)
            .set('Authorization', `Bearer abcd`)
            .send({});
        userResponse.status.should.equal(403);

        mockGetUserFromToken(ROLES.MANAGER);

        const managerResponse = await requester.post(`/api/v1/subscriptions/test-webhook-alert`)
            .set('Authorization', `Bearer abcd`)
            .send({});
        managerResponse.status.should.equal(403);
    });

    it('Validates the provided subscriptionId, rejecting if not provided', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        const res = await requester.post(`/api/v1/subscriptions/test-webhook-alert`)
            .set('Authorization', `Bearer abcd`)
            .send({
                email: 'test.user@wri.org',
            });
        res.status.should.equal(400);
    });

    it('Validates the provided alert, rejecting everything else other than "glad-alerts", "viirs-active-fires", "monthly-summary" or "glad-all', async () => {
        for (const i of [...Array(8).keys()]) {
            mockGetUserFromToken(ROLES.ADMIN);
        }

        const subscriptionOne = await new Subscription(createURLSubscription(
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

        const testBody = {
            url: 'http://potato-url.com/notify',
            subId: subscriptionOne.id,
        };

        const { beginDate, endDate } = bootstrapEmailNotificationTests();

        mockGLADAlertsGeostoreQuery();
        createURLSubscriptionCallMock(createGLADAlertsGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));
        (await requester.post(`/api/v1/subscriptions/test-webhook-alert`)
            .set('Authorization', `Bearer abcd`)
            .send({ ...testBody, alert: 'glad-alerts' })).status.should.equal(200);

        mockVIIRSAlertsGeostoreQuery(2);
        createURLSubscriptionCallMock(createViirsFireAlertsGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));
        (await requester.post(`/api/v1/subscriptions/test-webhook-alert`)
            .set('Authorization', `Bearer abcd`)
            .send({ ...testBody, alert: 'viirs-active-fires' })).status.should.equal(200);

        mockVIIRSAlertsGeostoreQuery(2);
        mockGLADAlertsGeostoreQuery(2);
        createURLSubscriptionCallMock(createMonthlySummaryGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));
        (await requester.post(`/api/v1/subscriptions/test-webhook-alert`)
            .set('Authorization', `Bearer abcd`)
            .send({ ...testBody, alert: 'monthly-summary' })).status.should.equal(200);

        mockGLADAllGeostoreQuery();
        createURLSubscriptionCallMock(createGLADAllGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));
        (await requester.post(`/api/v1/subscriptions/test-webhook-alert`)
            .set('Authorization', `Bearer abcd`)
            .send({ ...testBody, alert: 'glad-all' })).status.should.equal(200);

        mockGLADLGeostoreQuery();
        createURLSubscriptionCallMock(createGLADLGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));
        (await requester.post(`/api/v1/subscriptions/test-webhook-alert`)
            .set('Authorization', `Bearer abcd`)
            .send({ ...testBody, alert: 'glad-l' })).status.should.equal(200);

        mockGLADS2GeostoreQuery();
        createURLSubscriptionCallMock(createGLADS2GeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));
        (await requester.post(`/api/v1/subscriptions/test-webhook-alert`)
            .set('Authorization', `Bearer abcd`)
            .send({ ...testBody, alert: 'glad-s2' })).status.should.equal(200);

        mockGLADRADDGeostoreQuery();
        createURLSubscriptionCallMock(createGLADRADDGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));
        (await requester.post(`/api/v1/subscriptions/test-webhook-alert`)
            .set('Authorization', `Bearer abcd`)
            .send({ ...testBody, alert: 'glad-radd' })).status.should.equal(200);

        (await requester.post(`/api/v1/subscriptions/test-webhook-alert`)
            .set('Authorization', `Bearer abcd`)
            .send({ ...testBody, alert: 'other' })).status.should.equal(400);
    });

    it('Testing an webhook alert for GLAD alerts for a language that\'s not EN should return a 200 OK response', async () => {
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
                language: 'fr'
            },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();

        mockGLADAlertsGeostoreQuery();

        subscription.language = 'en';
        createURLSubscriptionCallMock(createGLADAlertsGeostoreURLSubscriptionBody(subscription, beginDate, endDate));

        const response = await requester.post(`/api/v1/subscriptions/test-webhook-alert`)
            .set('Authorization', `Bearer abcd`)
            .send({
                url: 'http://potato-url.com/notify',
                subId: subscription._id,
                alert: 'glad-alerts',
                language: 'en',
            });

        response.status.should.equal(200);
        response.body.should.have.property('success').and.equal(true);
    });

    afterEach(async () => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
    });
});
