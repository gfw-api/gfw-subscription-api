const nock = require('nock');
const Subscription = require('models/subscription');
const { expect } = require('chai');
const { omit } = require('lodash');
const chai = require('chai');
const { createRequest } = require('./utils/test-server');
const { ROLES } = require('./utils/test.constants');
const {
    ensureCorrectError, createSubInDB, getUUID, createAuthCases, mockGetUserFromToken
} = require('./utils/helpers');

chai.should();

const prefix = '/api/v1/subscriptions/';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

let subscription;
const authCases = createAuthCases('123', 'delete');

describe('Delete subscription endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        subscription = await createRequest(prefix, 'delete');
        authCases.setRequester(subscription);

        await Subscription.deleteMany({}).exec();
    });

    it('Deleting subscription without provided user should fall', authCases.isUserRequired());

    it('Deleting subscription with provided user but with not existing subscription for user should fall', async () => {
        mockGetUserFromToken(ROLES.USER);

        await createSubInDB(getUUID());
        const response = await subscription
            .delete('41224d776a326fb40f000001')
            .set('Authorization', `Bearer abcd`);

        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');
    });

    it('Deleting subscription should return not found when subscription doesn\'t exist', async () => {
        mockGetUserFromToken(ROLES.USER);

        const response = await subscription
            .delete('41224d776a326fb40f000001')
            .set('Authorization', `Bearer abcd`);

        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');
    });

    it('Deleting subscription should return bad request when id is not valid', async () => {
        mockGetUserFromToken(ROLES.USER);

        const response = await subscription
            .delete('123')
            .set('Authorization', `Bearer abcd`);

        response.status.should.equal(400);
        ensureCorrectError(response.body, 'ID is not valid');
    });

    it('Deleting subscription should return subscription and delete it (happy case)', async () => {
        mockGetUserFromToken(ROLES.USER);

        const createdSubscription = await createSubInDB(ROLES.USER.id);
        const response = await subscription
            .delete(createdSubscription._id)
            .set('Authorization', `Bearer abcd`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.instanceOf(Object);
        const { data } = response.body;

        data.type.should.equal('subscription');
        data.id.should.equal(createdSubscription._id.toString());
        data.should.have.property('attributes').and.instanceOf(Object);

        // omit fields which are not present to user from response body and convert the createdAt to ISO string
        const expectedSubscription = omit({
            // eslint-disable-next-line no-underscore-dangle
            ...createdSubscription._doc,
            createdAt: createdSubscription.createdAt.toISOString(),
        }, ['_id', 'updateAt', 'application', '__v']);
        data.attributes.should.deep.equal(expectedSubscription);

        const subscriptions = await Subscription.find({});
        expect(subscriptions).to.be.length(0);
    });

    afterEach(async () => {
        await Subscription.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
