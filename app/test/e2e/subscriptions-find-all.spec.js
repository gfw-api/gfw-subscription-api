/* eslint-disable no-unused-expressions,no-unused-vars,no-undef */
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

describe('Find all subscriptions tests', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();

        await Subscription.deleteMany({}).exec();
    });

    it('Finding all subscriptions is only allowed when the request is performed by a micro service, failing with 401 Unauthorized otherwise', async () => {
        const noTokenResponse = await requester.get(`/api/v1/subscriptions/find-all`).send();
        noTokenResponse.status.should.equal(401);

        const userResponse = await requester.get(`/api/v1/subscriptions/find-all`).query({ loggedUser: JSON.stringify(ROLES.USER) }).send();
        userResponse.status.should.equal(401);

        const managerResponse = await requester.get(`/api/v1/subscriptions/find-all`).query({ loggedUser: JSON.stringify(ROLES.MANAGER) }).send();
        managerResponse.status.should.equal(401);

        const adminResponse = await requester.get(`/api/v1/subscriptions/find-all`).query({ loggedUser: JSON.stringify(ROLES.ADMIN) }).send();
        adminResponse.status.should.equal(401);

        const superAdminResponse = await requester.get(`/api/v1/subscriptions/find-all`).query({ loggedUser: JSON.stringify(ROLES.SUPERADMIN) }).send();
        superAdminResponse.status.should.equal(401);
    });

    it('Finding all subscriptions when there are no existing subscriptions returns a 200 OK response with no data', async () => {
        const response = await requester
            .get(`/api/v1/subscriptions/find-all`)
            .query({ loggedUser: JSON.stringify(ROLES.MICROSERVICE) })
            .send();
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(0);
    });

    it('Finding all subscriptions should return a 200 OK response with all the subscriptions', async () => {
        await new Subscription(createSubscription(ROLES.USER.id)).save();
        await new Subscription(createSubscription(ROLES.MANAGER.id)).save();
        await new Subscription(createSubscription(ROLES.ADMIN.id)).save();
        await new Subscription(createSubscription(ROLES.SUPERADMIN.id)).save();
        await new Subscription(createSubscription('123')).save();

        const response = await requester
            .get(`/api/v1/subscriptions/find-all`)
            .query({ loggedUser: JSON.stringify(ROLES.MICROSERVICE) })
            .send();
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(5);
    });

    it('Finding all subscriptions allows filtering by application query param, returns 200 OK with the correct data', async () => {
        const gfwSub1 = await new Subscription(createSubscription(ROLES.USER.id, null, { application: 'gfw' })).save();
        const gfwSub2 = await new Subscription(createSubscription(ROLES.MANAGER.id, null, { application: 'gfw' })).save();
        const rwSub1 = await new Subscription(createSubscription(ROLES.USER.id, null, { application: 'rw' })).save();
        const rwSub2 = await new Subscription(createSubscription(ROLES.MANAGER.id, null, { application: 'rw' })).save();

        const response1 = await requester
            .get(`/api/v1/subscriptions/find-all`)
            .query({ loggedUser: JSON.stringify(ROLES.MICROSERVICE), application: 'gfw' })
            .send();
        response1.status.should.equal(200);
        response1.body.should.have.property('data').with.lengthOf(2);
        response1.body.data.map((el) => el.id).should.contain(gfwSub1.id);
        response1.body.data.map((el) => el.id).should.contain(gfwSub2.id);

        const response2 = await requester
            .get(`/api/v1/subscriptions/find-all`)
            .query({ loggedUser: JSON.stringify(ROLES.MICROSERVICE), application: 'rw' })
            .send();
        response2.status.should.equal(200);
        response2.body.should.have.property('data').with.lengthOf(2);
        response2.body.data.map((el) => el.id).should.contain(rwSub1.id);
        response2.body.data.map((el) => el.id).should.contain(rwSub2.id);
    });

    it('Finding subscriptions allows filtering by environment query param, returns 200 OK with the correct data', async () => {
        const prodSub1 = await new Subscription(createSubscription(ROLES.USER.id, null, { env: 'production' })).save();
        const prodSub2 = await new Subscription(createSubscription(ROLES.MANAGER.id, null, { env: 'production' })).save();
        const stgSub1 = await new Subscription(createSubscription(ROLES.USER.id, null, { env: 'staging' })).save();
        const stgSub2 = await new Subscription(createSubscription(ROLES.MANAGER.id, null, { env: 'staging' })).save();

        const response1 = await requester
            .get(`/api/v1/subscriptions/find-all`)
            .query({ loggedUser: JSON.stringify(ROLES.MICROSERVICE), env: 'production' })
            .send();
        response1.status.should.equal(200);
        response1.body.should.have.property('data').with.lengthOf(2);
        response1.body.data.map((el) => el.id).should.contain(prodSub1.id);
        response1.body.data.map((el) => el.id).should.contain(prodSub2.id);

        const response2 = await requester
            .get(`/api/v1/subscriptions/find-all`)
            .query({ loggedUser: JSON.stringify(ROLES.MICROSERVICE), env: 'staging' })
            .send();
        response2.status.should.equal(200);
        response2.body.should.have.property('data').with.lengthOf(2);
        response2.body.data.map((el) => el.id).should.contain(stgSub1.id);
        response2.body.data.map((el) => el.id).should.contain(stgSub2.id);
    });

    afterEach(async () => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
    });
});
