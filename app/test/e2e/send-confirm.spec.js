/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const Subscription = require('models/subscription');
const {
    createSubscription,
    ensureCorrectError,
    createAuthCases,
    getUUID,
} = require('./src/utils');
const { createMockSendConfirmationSUB } = require('./src/mock');
const { ROLES } = require('./src/test.constants');
const { createRequest } = require('./src/test-server');

const prefix = '/api/v1/subscriptions';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

let subscription;
const authCases = createAuthCases('/123/send_confirmation', 'get');

describe('Send confirmation endpoint', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        subscription = await createRequest(prefix, 'get');
        authCases.setRequester(subscription);

        Subscription.remove({}).exec();
    });

    it('Sending confirm subscription without provide loggedUser should fall', authCases.isLoggedUserRequired());

    it('Sending confirm subscription with provide loggedUser as not valid json string should fall', authCases.isLoggedUserJSONString());

    it('Sending confirm subscription with provide loggedUser as not an object json string should fall', authCases.isLoggedUserJSONObject());

    it('Sending confirm subscription with being authenticated but with not existing subscription for user should fall', async () => {
        createSubscription(ROLES.USER.id, getUUID());
        const response = await subscription
            .get('/41224d776a326fb40f000001/send_confirmation')
            .query({ loggedUser: JSON.stringify(ROLES.USER) })
            .send();
        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');
    });

    it('Sending confirm subscription should return not found when subscription doesn\'t exist', async () => {
        const response = await subscription
            .get('/41224d776a326fb40f000001/send_confirmation')
            .query({ loggedUser: JSON.stringify(ROLES.USER) })
            .send();
        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');
    });

    it('Sending confirm subscription should return bad request when id is not valid', async () => {
        const response = await subscription
            .get('/123/send_confirmation')
            .query({ loggedUser: JSON.stringify(ROLES.USER) })
            .send();
        response.status.should.equal(400);
        ensureCorrectError(response.body, 'ID is not valid');
    });

    it('Sending confirmation subscription should redirect to flagship (happy case)', async () => {
        createMockSendConfirmationSUB();
        const createdSubscription = await new Subscription(createSubscription(ROLES.USER.id)).save();
        const response = await subscription
            .get(`/${createdSubscription._id}/send_confirmation`)
            .query({ loggedUser: JSON.stringify(ROLES.USER), application: 'rw' })
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
