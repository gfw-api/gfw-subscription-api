const nock = require('nock');
const Subscription = require('models/subscription');
const config = require('config');
const chai = require('chai');
const redis = require('redis');
const { sleep } = require('sleep');
const {
    createSubscription,
    ensureCorrectError,
    createAuthCases,
    getUUID,
    validRedisMessage,
    mockGetUserFromToken
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

        subscription = await createRequest(prefix, 'get');
        authCases.setRequester(subscription);

        await Subscription.deleteMany({}).exec();
    });

    it('Sending confirm subscription without provided user should fall', authCases.isUserRequired());

    it('Sending confirm subscription with being authenticated but with not existing subscription for user should fall', async () => {
        mockGetUserFromToken(ROLES.USER);

        this.channel.on('message', () => should.fail('should not be called'));

        createSubscription(ROLES.USER.id, getUUID());
        const response = await subscription
            .get('/41224d776a326fb40f000001/send_confirmation')
            .set('Authorization', `Bearer abcd`)
            .send();
        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');

        sleep(1);
    });

    it('Sending confirm subscription should return not found when subscription doesn\'t exist', async () => {
        mockGetUserFromToken(ROLES.USER);

        this.channel.on('message', () => should.fail('should not be called'));

        const response = await subscription
            .get('/41224d776a326fb40f000001/send_confirmation')
            .set('Authorization', `Bearer abcd`)
            .send();
        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');

        sleep(1);
    });

    it('Sending confirm subscription should return bad request when id is not valid', async () => {
        mockGetUserFromToken(ROLES.USER);

        this.channel.on('message', () => should.fail('should not be called'));

        const response = await subscription
            .get('/123/send_confirmation')
            .set('Authorization', `Bearer abcd`)
            .send();
        response.status.should.equal(400);
        ensureCorrectError(response.body, 'ID is not valid');

        sleep(1);
    });

    it('Sending confirmation subscription should redirect to flagship and emit a redis message (happy case)', async () => {
        mockGetUserFromToken(ROLES.USER);

        this.channel.on('message', validRedisMessage({
            template: 'subscription-confirmation-en',
            application: 'gfw',
            language: 'en',
        }));

        createMockSendConfirmationSUB();
        const createdSubscription = await new Subscription(createSubscription(ROLES.USER.id)).save();
        const response = await subscription
            .get(`/${createdSubscription._id}/send_confirmation`)
            .set('Authorization', `Bearer abcd`)
            .query({ application: 'rw' })
            .send();
        response.status.should.equal(200);
        response.body.mockMessage.should.equal('Should redirect');

        process.on('unhandledRejection', (err) => should.fail(err));
    });

    it('Providing redirect=false as query param disables the redirection (happy case)', async () => {
        mockGetUserFromToken(ROLES.USER);

        const createdSubscription = await new Subscription(createSubscription(ROLES.USER.id)).save();
        const response = await subscription
            .get(`/${createdSubscription._id}/send_confirmation`)
            .set('Authorization', `Bearer abcd`)
            .query({
                application: 'rw',
                redirect: false,
            })
            .send();
        response.status.should.equal(200);
        response.body._id.should.equal(createdSubscription._id.toString());

        process.on('unhandledRejection', (err) => should.fail(err));
    });

    afterEach(async () => {
        process.removeAllListeners('unhandledRejection');
        this.channel.removeAllListeners('message');
        await Subscription.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
