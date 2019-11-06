/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const Subscription = require('models/subscription');
const config = require('config');
const chai = require('chai');
const redis = require('redis');
const {
    createSubscription,
    ensureCorrectError,
    createAuthCases,
    getUUID,
    sleep,
    validRedisMessage
} = require('./utils/helpers');
const { createMockSendConfirmationSUB } = require('./utils/mock');
const { ROLES } = require('./utils/test.constants');
const { createRequest } = require('./utils/test-server');

const should = chai.should();

const prefix = '/api/v1/subscriptions';

const CHANNEL = config.get('apiGateway.queueName');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

let subscription;
const authCases = createAuthCases('/123/send_confirmation', 'get');

describe('Send confirmation endpoint', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        this.channel = redis.createClient({ url: config.get('redis.url') });
        this.channel.subscribe(CHANNEL);

        nock.cleanAll();

        subscription = await createRequest(prefix, 'get');
        authCases.setRequester(subscription);

        Subscription.remove({}).exec();
    });

    it('Sending confirm subscription without provide loggedUser should fall', authCases.isLoggedUserRequired());

    it('Sending confirm subscription with provide loggedUser as not valid json string should fall', authCases.isLoggedUserJSONString());

    it('Sending confirm subscription with provide loggedUser as not an object json string should fall', authCases.isLoggedUserJSONObject());

    it('Sending confirm subscription with being authenticated but with not existing subscription for user should fall', async () => {
        this.channel.on('message', () => should.fail('should not be called'));

        createSubscription(ROLES.USER.id, getUUID());
        const response = await subscription
            .get('/41224d776a326fb40f000001/send_confirmation')
            .query({ loggedUser: JSON.stringify(ROLES.USER) })
            .send();
        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');

        await sleep(1000);
    });

    it('Sending confirm subscription should return not found when subscription doesn\'t exist', async () => {
        this.channel.on('message', () => should.fail('should not be called'));

        const response = await subscription
            .get('/41224d776a326fb40f000001/send_confirmation')
            .query({ loggedUser: JSON.stringify(ROLES.USER) })
            .send();
        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');

        await sleep(1000);
    });

    it('Sending confirm subscription should return bad request when id is not valid', async () => {
        this.channel.on('message', () => should.fail('should not be called'));

        const response = await subscription
            .get('/123/send_confirmation')
            .query({ loggedUser: JSON.stringify(ROLES.USER) })
            .send();
        response.status.should.equal(400);
        ensureCorrectError(response.body, 'ID is not valid');

        await sleep(1000);
    });

    it('Sending confirmation subscription should redirect to flagship and emit a redis message (happy case)', async () => {
        this.channel.on('message', validRedisMessage({
            template: 'subscription-confirmation-en',
            application: 'gfw',
            language: 'en',
        }));

        createMockSendConfirmationSUB();
        const createdSubscription = await new Subscription(createSubscription(ROLES.USER.id)).save();
        const response = await subscription
            .get(`/${createdSubscription._id}/send_confirmation`)
            .query({ loggedUser: JSON.stringify(ROLES.USER), application: 'rw' })
            .send();
        response.status.should.equal(200);
        response.body.mockMessage.should.equal('Should redirect');

        process.on('unhandledRejection', err => should.fail(err));
    });

    afterEach(() => {
        process.removeAllListeners('unhandledRejection');
        this.channel.removeAllListeners('message');
        Subscription.remove({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
