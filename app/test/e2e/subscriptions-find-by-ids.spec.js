/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const chai = require('chai');
const Subscription = require('models/subscription');
const { createSubscription } = require('./utils/helpers');
const { ROLES } = require('./utils/test.constants');
const { getTestServer } = require('./utils/test-server');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

chai.should();

let requester;

describe('Find subscriptions by ids tests', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();

        await Subscription.deleteMany({}).exec();
    });

    it('Finding subscriptions providing wrong type data (non-string ids) returns a 200 OK response with no data', async () => {
        const response = await requester
            .post(`/api/v1/subscriptions/find-by-ids`)
            .send({ ids: [{}] });
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(0);
    });

    it('Finding subscriptions by ids without providing ids should return a 200 OK response with no data', async () => {
        const response = await requester.post(`/api/v1/subscriptions/find-by-ids`).send();
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(0);
    });

    it('Finding subscriptions by ids providing invalid ids should return a 200 OK response with no data', async () => {
        const response = await requester
            .post(`/api/v1/subscriptions/find-by-ids`)
            .send({ ids: ['non-existing-id'] });
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(0);
    });

    it('Finding subscriptions by ids providing existing ids should return a 200 OK response with the subscription data', async () => {
        const subscriptionOne = await new Subscription(createSubscription(ROLES.USER.id)).save();
        const subscriptionTwo = await new Subscription(createSubscription(ROLES.USER.id)).save();

        const response = await requester
            .post(`/api/v1/subscriptions/find-by-ids`)
            .send({ ids: [subscriptionOne.id, subscriptionTwo.id] });
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(2);
    });

    it('Finding subscriptions by ids providing a mix of valid and invalid ids should return a 200 OK response with only the subscription data for valid ids', async () => {
        const subscriptionOne = await new Subscription(createSubscription(ROLES.USER.id)).save();
        const subscriptionTwo = await new Subscription(createSubscription(ROLES.USER.id)).save();

        const response = await requester
            .post(`/api/v1/subscriptions/find-by-ids`)
            .send({ ids: [subscriptionOne.id, subscriptionTwo.id, 'invalid-id'] });
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(2);
    });

    afterEach(async () => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
    });
});
