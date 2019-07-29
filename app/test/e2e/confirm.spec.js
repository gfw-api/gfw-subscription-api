/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const config = require('config');
const Subscription = require('models/subscription');
const {
    createSubscription,
    ensureCorrectError,
} = require('./src/utils');
const { createMockConfirmSUB } = require('./src/mock');
const { ROLES } = require('./src/test.constants');
const { createRequest } = require('./src/test-server');

const prefix = '/api/v1/subscriptions';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

let subscription;

describe('Confirm subscription endpoint', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        subscription = await createRequest(prefix, 'get');

        nock.cleanAll();

        Subscription.remove({}).exec();
    });

    it('Confirming subscription should return not found when subscription doesn\'t exist', async () => {
        const response = await subscription
            .get('/41224d776a326fb40f000001/confirm')
            .send();
        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');
    });

    it('Confirming subscription should return bad request when id is not valid', async () => {
        const response = await subscription
            .get('/123/confirm')
            .send();
        response.status.should.equal(400);
        ensureCorrectError(response.body, 'ID is not valid');
    });

    it('Confirming subscription should redirect to flagship (happy case)', async () => {
        createMockConfirmSUB();
        const createdSubscription = await new Subscription(createSubscription(ROLES.USER.id)).save();
        const response = await subscription
            .get(`/${createdSubscription._id}/confirm`)
            .query({ loggedUser: JSON.stringify(ROLES.USER), application: 'test' })
            .send();
        response.status.should.equal(200);
        response.body.mockMessage.should.equal('Should redirect');
    });

    afterEach(() => {
        Subscription.remove({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
