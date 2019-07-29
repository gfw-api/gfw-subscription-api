/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const chai = require('chai');
const Subscription = require('models/subscription');
const { createSubscription, getUUID } = require('./src/utils');
const { ROLES } = require('./src/test.constants');
const { getTestServer } = require('./src/test-server');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

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

    it('Get all subscriptions as an anonymous user should return an "unauthorized" error with matching 401 HTTP code', async () => {
        const response = await requester.get(`/api/v1/subscriptions`).send();

        response.status.should.equal(401);
        response.body.should.have.property('errors').and.be.an('array').and.length(1);
        response.body.errors[0].should.have.property('status').and.equal(401);
        response.body.errors[0].should.have.property('detail').and.equal('Not authorized');
    });

    it('Get all subscriptions as an authenticated user should return an empty list', async () => {
        const response = await requester
            .get(`/api/v1/subscriptions`)
            .query({ loggedUser: JSON.stringify(ROLES.USER) })
            .send();

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(0);
    });

    it('Get all subscriptions should be successful and return a list of subscriptions (populated db)', async () => {
        const subscriptionOne = await new Subscription(createSubscription(ROLES.USER.id)).save();
        const subscriptionTwo = await new Subscription(createSubscription(ROLES.USER.id)).save();
        await new Subscription(createSubscription(getUUID())).save();

        const response = await requester
            .get(`/api/v1/subscriptions`)
            .query({ loggedUser: JSON.stringify(ROLES.USER), application: 'rw' })
            .send();

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(2);

        const responseSubscriptionOne = response.body.data[0];
        const responseSubscriptionTwo = response.body.data[1];

        responseSubscriptionOne.id.should.equal(subscriptionOne.id);
        responseSubscriptionOne.attributes.name.should.equal(subscriptionOne.name);
        responseSubscriptionOne.attributes.datasets.should.be.an('array').and.length(1).and.contains(subscriptionOne.datasets[0]);
        responseSubscriptionOne.attributes.datasetsQuery.should.be.an('array').and.length(0);
        responseSubscriptionOne.attributes.params.should.be.an('object').and.deep.equal({ "geostore": "agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw" });
        responseSubscriptionOne.attributes.userId.should.equal(subscriptionOne.userId);
        responseSubscriptionOne.attributes.confirmed.should.equal(subscriptionOne.confirmed);
        responseSubscriptionOne.attributes.resource.should.be.an('object');
        responseSubscriptionOne.attributes.resource.type.should.equal('EMAIL');

        responseSubscriptionTwo.id.should.equal(subscriptionTwo.id);
        responseSubscriptionTwo.attributes.name.should.equal(subscriptionTwo.name);
        responseSubscriptionTwo.attributes.datasets.should.be.an('array').and.length(1).and.contains(subscriptionTwo.datasets[0]);
        responseSubscriptionTwo.attributes.datasetsQuery.should.be.an('array').and.length(0);
        responseSubscriptionTwo.attributes.params.should.be.an('object').and.deep.equal({"geostore": "agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw"});
        responseSubscriptionTwo.attributes.userId.should.equal(subscriptionTwo.userId);
        responseSubscriptionTwo.attributes.confirmed.should.equal(subscriptionTwo.confirmed);
        responseSubscriptionTwo.attributes.resource.should.be.an('object');
        responseSubscriptionTwo.attributes.resource.type.should.equal('EMAIL');

        process.on('unhandledRejection', (error) => {
            should.fail(error);
        });
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
