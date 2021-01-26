s/* eslint-disable no-unused-expressions,no-unused-vars,no-undef */
const nock = require('nock');
const chai = require('chai');
const Subscription = require('models/subscription');
const { createSubscription, mockGetUserFromToken } = require('./utils/helpers');
const { ROLES } = require('./utils/test.constants');
const { getTestServer } = require('./utils/test-server');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

chai.should();

let requester;

describe('Find subscriptions for user tests', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();

        await Subscription.deleteMany({}).exec();
    });

    it('Finding subscriptions for users is only allowed when the request is performed by an admin or micro service, failing with 401 Unauthorized otherwise', async () => {
        const noTokenResponse = await requester.get(`/api/v1/subscriptions/user/1`).send();
        noTokenResponse.status.should.equal(401);

        mockGetUserFromToken(ROLES.USER);
        const userResponse = await requester.get(`/api/v1/subscriptions/user/1`)
            .set('Authorization', `Bearer abcd`)
            .send();
        userResponse.status.should.equal(401);

        mockGetUserFromToken(ROLES.MANAGER);
        const managerResponse = await requester.get(`/api/v1/subscriptions/user/1`)
            .set('Authorization', `Bearer abcd`)
            .send();
        managerResponse.status.should.equal(401);

        mockGetUserFromToken(ROLES.ADMIN);
        const adminResponse = await requester.get(`/api/v1/subscriptions/user/1`)
            .set('Authorization', `Bearer abcd`)
            .send();
        adminResponse.status.should.equal(200);

        mockGetUserFromToken(ROLES.SUPERADMIN);
        const superadminResponse = await requester.get(`/api/v1/subscriptions/user/1`)
            .set('Authorization', `Bearer abcd`)
            .send();
        superadminResponse.status.should.equal(200);

        mockGetUserFromToken(ROLES.MICROSERVICE);
        const microserviceResponse = await requester.get(`/api/v1/subscriptions/user/1`)
            .set('Authorization', `Bearer abcd`)
            .send();
        microserviceResponse.status.should.equal(200);
    });

    it('Finding subscriptions for a user that does not have associated subscriptions returns a 200 OK response with no data', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        const response = await requester
            .get(`/api/v1/subscriptions/user/1`)
            .set('Authorization', `Bearer abcd`)
            .send();
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(0);
    });

    it('Finding subscriptions for users by ids providing existing ids should return a 200 OK response with the subscription data', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        await new Subscription(createSubscription(ROLES.USER.id)).save();
        await new Subscription(createSubscription(ROLES.USER.id)).save();
        await new Subscription(createSubscription('123')).save();

        const response = await requester
            .get(`/api/v1/subscriptions/user/${ROLES.USER.id}`)
            .set('Authorization', `Bearer abcd`)
            .send();
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(2);
        response.body.data.every((subscription) => subscription.attributes.userId === ROLES.USER.id).should.be.true;
    });

    it('Finding subscriptions allows filtering by application query param, returns 200 OK with the correct data', async () => {
        mockGetUserFromToken(ROLES.ADMIN);
        mockGetUserFromToken(ROLES.ADMIN);

        const gfwSub = await new Subscription(createSubscription(ROLES.USER.id, null, { application: 'gfw' })).save();
        const rwSub = await new Subscription(createSubscription(ROLES.USER.id, null, { application: 'rw' })).save();

        const response1 = await requester
            .get(`/api/v1/subscriptions/user/${ROLES.USER.id}`)
            .set('Authorization', `Bearer abcd`)
            .query({ application: 'gfw' })
            .send();
        response1.status.should.equal(200);
        response1.body.should.have.property('data').with.lengthOf(1);
        response1.body.data[0].should.have.property('id').and.be.equal(gfwSub.id);

        const response2 = await requester
            .get(`/api/v1/subscriptions/user/${ROLES.USER.id}`)
            .set('Authorization', `Bearer abcd`)
            .query({ application: 'rw' })
            .send();
        response2.status.should.equal(200);
        response2.body.should.have.property('data').with.lengthOf(1);
        response2.body.data[0].should.have.property('id').and.be.equal(rwSub.id);
    });

    it('Finding subscriptions allows filtering by environment query param, returns 200 OK with the correct data', async () => {
        mockGetUserFromToken(ROLES.ADMIN);
        mockGetUserFromToken(ROLES.ADMIN);

        const prodSub = await new Subscription(createSubscription(ROLES.USER.id, null, { env: 'production' })).save();
        const stgSub = await new Subscription(createSubscription(ROLES.USER.id, null, { env: 'staging' })).save();

        const response1 = await requester
            .get(`/api/v1/subscriptions/user/${ROLES.USER.id}`)
            .set('Authorization', `Bearer abcd`)
            .query({ env: 'production' })
            .send();
        response1.status.should.equal(200);
        response1.body.should.have.property('data').with.lengthOf(1);
        response1.body.data[0].should.have.property('id').and.be.equal(prodSub.id);

        const response2 = await requester
            .get(`/api/v1/subscriptions/user/${ROLES.USER.id}`)
            .set('Authorization', `Bearer abcd`)
            .query({ env: 'staging' })
            .send();
        response2.status.should.equal(200);
        response2.body.should.have.property('data').with.lengthOf(1);
        response2.body.data[0].should.have.property('id').and.be.equal(stgSub.id);
    });

    afterEach(async () => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
    });
});
