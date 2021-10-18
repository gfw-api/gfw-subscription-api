const chai = require('chai');
const config = require('config');
const nock = require('nock');
const redis = require('redis');

const Subscription = require('models/subscription');

const { createSubscription, mockGetUserFromToken } = require('./utils/helpers');
const { ROLES } = require('./utils/test.constants');
const { getTestServer } = require('./utils/test-server');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();

let requester;

const CHANNEL = config.get('apiGateway.queueName');
const redisClient = redis.createClient({ url: config.get('redis.url') });
redisClient.subscribe(CHANNEL);

describe('Test email alerts spec', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();

        await Subscription.deleteMany({}).exec();
    });

    it('Testing email alerts is only allowed for ADMIN users, failing with 401 Unauthorized otherwise', async () => {
        const noTokenResponse = await requester.post(`/api/v1/subscriptions/test-email-alerts`).send();
        noTokenResponse.status.should.equal(401);

        mockGetUserFromToken(ROLES.USER);

        const userResponse = await requester.post(`/api/v1/subscriptions/test-email-alerts`)
            .set('Authorization', `Bearer abcd`)
            .send({});
        userResponse.status.should.equal(403);

        mockGetUserFromToken(ROLES.MANAGER);

        const managerResponse = await requester.post(`/api/v1/subscriptions/test-email-alerts`)
            .set('Authorization', `Bearer abcd`)
            .send({});
        managerResponse.status.should.equal(403);
    });

    it('Validates the provided subscriptionId, rejecting if not provided', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        const res = await requester.post(`/api/v1/subscriptions/test-email-alerts`)
            .set('Authorization', `Bearer abcd`)
            .send({
                email: 'henrique.pacheco@vizzuality.com',
            });
        res.status.should.equal(400);
    });

    it('Validates the provided alert, rejecting everything else other than "glad-alerts", "viirs-active-fires", "monthly-summary" or "glad-all', async () => {
        mockGetUserFromToken(ROLES.ADMIN);
        mockGetUserFromToken(ROLES.ADMIN);
        mockGetUserFromToken(ROLES.ADMIN);
        mockGetUserFromToken(ROLES.ADMIN);
        mockGetUserFromToken(ROLES.ADMIN);

        const testBody = {
            email: 'henrique.pacheco@vizzuality.com',
            subId: '123',
        };

        const res1 = await requester.post(`/api/v1/subscriptions/test-email-alerts`)
            .set('Authorization', `Bearer abcd`)
            .send({ ...testBody, alert: 'glad-alerts' });
        res1.status.should.equal(200);

        const res2 = await requester.post(`/api/v1/subscriptions/test-email-alerts`)
            .set('Authorization', `Bearer abcd`)
            .send({ ...testBody, alert: 'viirs-active-fires' });
        res2.status.should.equal(200);

        const res3 = await requester.post(`/api/v1/subscriptions/test-email-alerts`)
            .set('Authorization', `Bearer abcd`)
            .send({ ...testBody, alert: 'monthly-summary' });
        res3.status.should.equal(200);

        const res4 = await requester.post(`/api/v1/subscriptions/test-email-alerts`)
            .set('Authorization', `Bearer abcd`)
            .send({ ...testBody, alert: 'glad-all' });
        res4.status.should.equal(200);

        const res5 = await requester.post(`/api/v1/subscriptions/test-email-alerts`)
            .set('Authorization', `Bearer abcd`)
            .send({ ...testBody, alert: 'other' });
        res5.status.should.equal(400);
    });

    it('Testing an email alert for GLAD alerts should return a 200 OK response', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        const sub = await new Subscription(createSubscription(ROLES.ADMIN.id, 'glad-alerts')).save();
        process.on('unhandledRejection', (args) => should.fail(...args));

        // Mock GFW Data API calls
        nock(config.get('dataApi.url'))
            .get('/dataset/geostore__integrated_alerts__daily_alerts/latest/query')
            .query((data) => data.sql && data.sql.includes('geostore__id=\'agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw\''))
            .matchHeader('x-api-key', config.get('dataApi.apiKey'))
            .matchHeader('origin', config.get('dataApi.origin'))
            .reply(200, {
                data: [
                    {
                        wdpa_protected_area__iucn_cat: 'Category 1',
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: true,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: true,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: true,
                        alert__count: 100,
                        alert_area__ha: 10,
                    }
                ],
                status: 'success'
            });

        const body = {
            email: 'henrique.pacheco@vizzuality.com',
            subId: sub._id,
            alert: 'glad-alerts',
        };

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'glad-updated-notification-en':
                    jsonMessage.should.have.property('sender').and.equal('gfw');
                    jsonMessage.should.have.property('data').and.be.a('object');

                    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
                    jsonMessage.recipients[0].should.be.an('object')
                        .and.have.property('address')
                        .and.have.property('email')
                        .and.equal(body.email);
                    break;
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }
        });

        const response = await requester.post(`/api/v1/subscriptions/test-email-alerts`)
            .set('Authorization', `Bearer abcd`)
            .send(body);
        response.status.should.equal(200);
        response.body.should.have.property('success').and.equal(true);
    });

    it('Testing an email alert for GLAD alerts for a language that\'s not EN should return a 200 OK response', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        const sub = await new Subscription(createSubscription(ROLES.ADMIN.id, 'glad-alerts')).save();
        process.on('unhandledRejection', (args) => should.fail(...args));

        // Mock GFW Data API calls
        nock(config.get('dataApi.url'))
            .get('/dataset/geostore__integrated_alerts__daily_alerts/latest/query')
            .query((data) => data.sql && data.sql.includes('geostore__id=\'agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw\''))
            .matchHeader('x-api-key', config.get('dataApi.apiKey'))
            .matchHeader('origin', config.get('dataApi.origin'))
            .reply(200, {
                data: [
                    {
                        wdpa_protected_area__iucn_cat: 'Category 1',
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: true,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: true,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: true,
                        alert__count: 100,
                        alert_area__ha: 10,
                    }
                ],
                status: 'success'
            });

        const body = {
            email: 'henrique.pacheco@vizzuality.com',
            subId: sub._id,
            alert: 'glad-alerts',
            language: 'fr',
        };

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'glad-updated-notification-fr':
                    jsonMessage.should.have.property('sender').and.equal('gfw');
                    jsonMessage.should.have.property('data').and.be.a('object');

                    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
                    jsonMessage.recipients[0].should.be.an('object')
                        .and.have.property('address')
                        .and.have.property('email')
                        .and.equal(body.email);
                    break;
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }
        });

        const response = await requester.post(`/api/v1/subscriptions/test-email-alerts`)
            .set('Authorization', `Bearer abcd`)
            .send(body);
        response.status.should.equal(200);
        response.body.should.have.property('success').and.equal(true);
    });

    afterEach(async () => {
        redisClient.removeAllListeners();
        process.removeAllListeners('unhandledRejection');

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
    });
});
