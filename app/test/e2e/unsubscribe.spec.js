/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const Subscription = require('models/subscription');
const {
    createSubscription,
    ensureCorrectError,
} = require('./utils/helpers');
const { createMockUnsubscribeSUB } = require('./utils/mock');
const { ROLES } = require('./utils/test.constants');
const { createRequest } = require('./utils/test-server');
const chai = require('chai');

const should = chai.should();

const prefix = '/api/v1/subscriptions';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

let subscription;

describe('Unsubscribe endpoint', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }
        nock.cleanAll();

        subscription = await createRequest(prefix, 'get');

        await Subscription.deleteMany({}).exec();
    });

    it('Unsubscribe should return not found when subscription doesn\'t exist', async () => {
        const response = await subscription
            .get('/41224d776a326fb40f000001/unsubscribe')
            .send();
        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');
    });

    it('Unsubscribe should return bad request when id is not valid', async () => {
        const response = await subscription
            .get('/123/unsubscribe')
            .send();
        response.status.should.equal(400);
        ensureCorrectError(response.body, 'ID is not valid');
    });

    it('Unsubscribe subscription should return deleted subscription (happy case)', async () => {
        const subData = createSubscription(ROLES.USER.id);

        const createdSubscription = await new Subscription(subData).save();
        const response = await subscription
            .get(`/${createdSubscription._id}/unsubscribe`)
            .query({ loggedUser: JSON.stringify(ROLES.USER), application: 'test' })
            .send();
        response.status.should.equal(200);
        response.body.data.should.have.property('attributes');

        const { data: { attributes }, data } = response.body;
        data.id.should.equal(createdSubscription._id.toString());
        data.type.should.equal('subscription');

        // delete fields which are not in the attributes from server response.
        delete subData.application;

        // set properties which are created on API side
        subData.createdAt = attributes.createdAt;
        subData.datasetsQuery = attributes.datasetsQuery;
        subData.language = attributes.language;

        attributes.should.deep.equal(subData);
    });

    it('Unsubscribe subscription with query param redirect should redirect to flagship (happy case)', async () => {
        createMockUnsubscribeSUB();
        const createdSubscription = await new Subscription(createSubscription(ROLES.USER.id)).save();
        const response = await subscription
            .get(`/${createdSubscription._id}/unsubscribe?redirect=true`)
            .query({ loggedUser: JSON.stringify(ROLES.USER), application: 'test' })
            .send();
        response.status.should.equal(200);
        response.body.mockMessage.should.equal('Should redirect');
    });

    afterEach(async () => {
        await Subscription.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
