const nock = require('nock');
const Subscription = require('models/subscription');
const chai = require('chai');
const {
    createSubscription,
    ensureCorrectError,
    mockGetUserFromToken
} = require('./utils/helpers');
const { createMockConfirmSUB } = require('./utils/mock');
const { ROLES } = require('./utils/test.constants');
const { createRequest } = require('./utils/test-server');

chai.should();

const prefix = '/api/v1/subscriptions';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

let requester;

describe('Confirm subscription endpoint', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await createRequest(prefix, 'get');

        nock.cleanAll();

        await Subscription.deleteMany({}).exec();
    });

    it('Confirming subscription should return not found when subscription doesn\'t exist', async () => {
        const response = await requester
            .get('/41224d776a326fb40f000001/confirm')
            .send();
        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');
    });

    it('Confirming subscription should return bad request when id is not valid', async () => {
        const response = await requester
            .get('/123/confirm')
            .send();
        response.status.should.equal(400);
        ensureCorrectError(response.body, 'ID is not valid');
    });

    it('Confirming subscription should redirect to flagship and update subscription to confirmed (happy case)', async () => {
        mockGetUserFromToken(ROLES.USER);

        createMockConfirmSUB();
        const createdSubscription = await new Subscription(
            createSubscription(ROLES.USER.id, null, { confirmed: false })
        ).save();

        const response = await requester
            .get(`/${createdSubscription._id}/confirm`)
            .set('Authorization', `Bearer abcd`)
            .query({ application: 'test' })
            .send();

        response.status.should.equal(200);
        response.body.mockMessage.should.equal('Should redirect');

        const updateSubscription = await Subscription.findById(createdSubscription._id);
        updateSubscription.confirmed.should.equal(true);
    });

    afterEach(async () => {
        await Subscription.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
