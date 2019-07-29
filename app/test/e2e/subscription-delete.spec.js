/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const Subscription = require('models/subscription');
const { expect } = require('chai');
const { omit } = require('lodash');
const { createRequest } = require('./src/test-server');
const { ROLES: { USER } } = require('./src/test.constants');
const {
    ensureCorrectError, createSubInDB, getUUID, createAuthCases
} = require('./src/utils');

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

        nock.cleanAll();

        Subscription.remove({}).exec();
    });

    it('Deleting subscription without provide loggedUser should fall', authCases.isLoggedUserRequired());

    it('Deleting subscription with provide loggedUser as not valid json string should fall', authCases.isLoggedUserJSONString());

    it('Deleting subscription with provide loggedUser as not an object json string should fall', authCases.isLoggedUserJSONObject());

    it('Deleting subscription with provide loggedUser but with not existing subscription for user should fall', async () => {
        await createSubInDB(getUUID());
        const response = await subscription
            .delete('41224d776a326fb40f000001')
            .query({ loggedUser: JSON.stringify(USER) });

        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');
    });

    it('Deleting subscription should return not found when subscription doesn\'t exist', async () => {
        const response = await subscription
            .delete('41224d776a326fb40f000001')
            .query({ loggedUser: JSON.stringify(USER) });

        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');
    });

    it('Deleting subscription should return bad request when id is not valid', async () => {
        const response = await subscription
            .delete('123')
            .query({ loggedUser: JSON.stringify(USER) });

        response.status.should.equal(400);
        ensureCorrectError(response.body, 'ID is not valid');
    });

    it('Deleting subscription should return subscription and delete it (happy case)', async () => {
        const createdSubscription = await createSubInDB(USER.id);
        const response = await subscription
            .delete(createdSubscription._id)
            .query({ loggedUser: JSON.stringify(USER) });

        response.status.should.equal(200);
        response.body.should.have.property('data').and.instanceOf(Object);
        const { data } = response.body;

        data.type.should.equal('subscription');
        data.id.should.equal(createdSubscription._id.toString());
        data.should.have.property('attributes').and.instanceOf(Object);

        // omit fields which are not present to user from response body and convert the createdAt to ISO string
        const expectedSubscription = omit(Object.assign({}, createdSubscription._doc, {
            createdAt: createdSubscription.createdAt.toISOString(),
        }), ['_id', 'updateAt', 'application', '__v']);
        data.attributes.should.deep.equal(expectedSubscription);

        const subscriptions = await Subscription.find({});
        expect(subscriptions).to.be.length(0);
    });

    afterEach(() => {
        Subscription.remove({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
