/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const chai = require('chai');
const Subscription = require('models/subscription');
const { createSubscription } = require('./utils');

const { getTestServer } = require('./test-server');

const should = chai.should();

let requester;

describe('Get subscriptions tests', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();

        Subscription.remove({}).exec();
    });

    it('Get all subscriptions as an anonymous user should be successful and return an empty list (empty db)', async () => {
        const response = await requester.get(`/api/v1/subscriptions`).send();

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(0);
        response.body.should.have.property('links').and.be.an('object');
    });

    it('Get all subscriptions should be successful and return a list of subscriptions (populated db)', async () => {
        const subscriptionOne = await new Subscription(createSubscription()).save();
        const subscriptionTwo = await new Subscription(createSubscription()).save();

        const response = await requester.get(`/api/v1/subscriptions`).send();

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(2);
        response.body.should.have.property('links').and.be.an('object');

        const responseSubscriptionOne = response.body.data[0];
        const responseSubscriptionTwo = response.body.data[1];

        subscriptionOne.name.should.equal(responseSubscriptionOne.attributes.name);
        subscriptionOne.dataset.should.equal(responseSubscriptionOne.attributes.dataset);
        subscriptionOne.userId.should.equal(responseSubscriptionOne.attributes.userId);
        subscriptionOne.slug.should.equal(responseSubscriptionOne.attributes.slug);
        subscriptionOne.sourceUrl.should.equal(responseSubscriptionOne.attributes.sourceUrl);
        subscriptionOne.queryUrl.should.equal(responseSubscriptionOne.attributes.queryUrl);

        subscriptionTwo.name.should.equal(responseSubscriptionTwo.attributes.name);
        subscriptionTwo.dataset.should.equal(responseSubscriptionTwo.attributes.dataset);
        subscriptionTwo.userId.should.equal(responseSubscriptionTwo.attributes.userId);
        subscriptionTwo.slug.should.equal(responseSubscriptionTwo.attributes.slug);
        subscriptionTwo.sourceUrl.should.equal(responseSubscriptionTwo.attributes.sourceUrl);
        subscriptionTwo.queryUrl.should.equal(responseSubscriptionTwo.attributes.queryUrl);
    });

    afterEach(() => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });

    after(() => {
        Subscription.remove({}).exec();
    });
});
