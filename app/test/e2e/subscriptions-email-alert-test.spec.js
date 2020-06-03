const chai = require('chai');
const config = require('config');
const nock = require('nock');
const redis = require('redis');

const Subscription = require('models/subscription');

const { createSubscription } = require('./utils/helpers');
const { createMockAlertsQuery } = require('./utils/mock');
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

        const userResponse = await requester.post(`/api/v1/subscriptions/test-email-alerts`).send({ loggedUser: ROLES.USER });
        userResponse.status.should.equal(403);

        const managerResponse = await requester.post(`/api/v1/subscriptions/test-email-alerts`).send({ loggedUser: ROLES.MANAGER });
        managerResponse.status.should.equal(403);
    });

    it('Validates the provided alert, rejecting everything else other than "glad-alerts" or "viirs-active-fires"', async () => {
        const res1 = await requester.post(`/api/v1/subscriptions/test-email-alerts`).send({
            loggedUser: ROLES.ADMIN,
            email: 'henrique.pacheco@vizzuality.com',
            alert: 'glad-alerts',
        });
        res1.status.should.equal(200);

        const res2 = await requester.post(`/api/v1/subscriptions/test-email-alerts`).send({
            loggedUser: ROLES.ADMIN,
            email: 'henrique.pacheco@vizzuality.com',
            alert: 'viirs-active-fires',
        });
        res2.status.should.equal(200);

        const res3 = await requester.post(`/api/v1/subscriptions/test-email-alerts`).send({
            loggedUser: ROLES.ADMIN,
            email: 'henrique.pacheco@vizzuality.com',
            alert: 'other',
        });
        res3.status.should.equal(400);
    });

    it('Testing an email alert for GLAD alerts should return a 200 OK response', async () => {
        await new Subscription(createSubscription(ROLES.ADMIN.id, 'glad-alerts')).save();
        process.on('unhandledRejection', (args) => should.fail(...args));
        createMockAlertsQuery(3);

        const body = {
            loggedUser: ROLES.ADMIN,
            email: 'henrique.pacheco@vizzuality.com',
            alert: 'glad-alerts',
        };

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'forest-change-notification-glads-en':
                    jsonMessage.should.have.property('sender').and.equal('gfw');
                    jsonMessage.should.have.property('data').and.be.a('object');

                    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
                    jsonMessage.recipients[0].should.be.an('object')
                        .and.have.property('address')
                        .and.have.property('email')
                        .and.equal(body.email);
                    break;
                case 'subscriptions-stats':
                    break;
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }
        });

        const response = await requester.post(`/api/v1/subscriptions/test-email-alerts`).send(body);
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
