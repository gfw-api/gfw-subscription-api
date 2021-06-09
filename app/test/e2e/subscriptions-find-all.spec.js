/* eslint-disable no-unused-expressions,no-unused-vars,no-undef */
const nock = require('nock');
const chai = require('chai');
const config = require('config');
const Subscription = require('models/subscription');
const { createSubscription, mockGetUserFromToken } = require('./utils/helpers');
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

    describe('Test pagination links', () => {
        it('Get subscriptions without referer header should be successful and use the request host', async () => {
            mockGetUserFromToken(ROLES.MICROSERVICE);

            const response = await requester
                .get(`/api/v1/subscriptions/find-all`)
                .set('Authorization', `Bearer abcd`);

            response.status.should.equal(200);
            response.body.should.have.property('data').and.be.an('array');
            response.body.should.have.property('links').and.be.an('object');
            response.body.links.should.have.property('self').and.equal(`http://127.0.0.1:${config.get('service.port')}/v1/subscriptions/find-all?page[number]=1&page[size]=10`);
            response.body.links.should.have.property('prev').and.equal(`http://127.0.0.1:${config.get('service.port')}/v1/subscriptions/find-all?page[number]=1&page[size]=10`);
            response.body.links.should.have.property('next').and.equal(`http://127.0.0.1:${config.get('service.port')}/v1/subscriptions/find-all?page[number]=1&page[size]=10`);
            response.body.links.should.have.property('first').and.equal(`http://127.0.0.1:${config.get('service.port')}/v1/subscriptions/find-all?page[number]=1&page[size]=10`);
            response.body.links.should.have.property('last').and.equal(`http://127.0.0.1:${config.get('service.port')}/v1/subscriptions/find-all?page[number]=1&page[size]=10`);
        });

        it('Get all subscriptions with referer header should be successful and use that header on the links on the response', async () => {
            mockGetUserFromToken(ROLES.MICROSERVICE);

            const response = await requester
                .get(`/api/v1/subscriptions/find-all`)
                .set('Authorization', `Bearer abcd`)
                .set('referer', `https://potato.com/get-me-all-the-data`);

            response.status.should.equal(200);
            response.body.should.have.property('data').and.be.an('array');
            response.body.should.have.property('links').and.be.an('object');
            response.body.links.should.have.property('self').and.equal('http://potato.com/v1/subscriptions/find-all?page[number]=1&page[size]=10');
            response.body.links.should.have.property('prev').and.equal('http://potato.com/v1/subscriptions/find-all?page[number]=1&page[size]=10');
            response.body.links.should.have.property('next').and.equal('http://potato.com/v1/subscriptions/find-all?page[number]=1&page[size]=10');
            response.body.links.should.have.property('first').and.equal('http://potato.com/v1/subscriptions/find-all?page[number]=1&page[size]=10');
            response.body.links.should.have.property('last').and.equal('http://potato.com/v1/subscriptions/find-all?page[number]=1&page[size]=10');
        });

        it('Get all subscriptions with x-rw-domain header should be successful and use that header on the links on the response', async () => {
            mockGetUserFromToken(ROLES.MICROSERVICE);

            const response = await requester
                .get(`/api/v1/subscriptions/find-all`)
                .set('Authorization', `Bearer abcd`)
                .set('x-rw-domain', `potato.com`);

            response.status.should.equal(200);
            response.body.should.have.property('data').and.be.an('array');
            response.body.should.have.property('links').and.be.an('object');
            response.body.links.should.have.property('self').and.equal('http://potato.com/v1/subscriptions/find-all?page[number]=1&page[size]=10');
            response.body.links.should.have.property('prev').and.equal('http://potato.com/v1/subscriptions/find-all?page[number]=1&page[size]=10');
            response.body.links.should.have.property('next').and.equal('http://potato.com/v1/subscriptions/find-all?page[number]=1&page[size]=10');
            response.body.links.should.have.property('first').and.equal('http://potato.com/v1/subscriptions/find-all?page[number]=1&page[size]=10');
            response.body.links.should.have.property('last').and.equal('http://potato.com/v1/subscriptions/find-all?page[number]=1&page[size]=10');
        });

        it('Get all subscriptions with x-rw-domain and referer headers should be successful and use the x-rw-domain header on the links on the response', async () => {
            mockGetUserFromToken(ROLES.MICROSERVICE);

            const response = await requester
                .get(`/api/v1/subscriptions/find-all`)
                .set('Authorization', `Bearer abcd`)
                .set('x-rw-domain', `potato.com`)
                .set('referer', `https://tomato.com/get-me-all-the-data`);

            response.status.should.equal(200);
            response.body.should.have.property('data').and.be.an('array');
            response.body.should.have.property('links').and.be.an('object');
            response.body.links.should.have.property('self').and.equal('http://potato.com/v1/subscriptions/find-all?page[number]=1&page[size]=10');
            response.body.links.should.have.property('prev').and.equal('http://potato.com/v1/subscriptions/find-all?page[number]=1&page[size]=10');
            response.body.links.should.have.property('next').and.equal('http://potato.com/v1/subscriptions/find-all?page[number]=1&page[size]=10');
            response.body.links.should.have.property('first').and.equal('http://potato.com/v1/subscriptions/find-all?page[number]=1&page[size]=10');
            response.body.links.should.have.property('last').and.equal('http://potato.com/v1/subscriptions/find-all?page[number]=1&page[size]=10');
        });
    });

    it('Finding all subscriptions is only allowed when the request is performed by a micro service, failing with 401 Unauthorized otherwise', async () => {
        const noTokenResponse = await requester.get(`/api/v1/subscriptions/find-all`).send();
        noTokenResponse.status.should.equal(401);

        mockGetUserFromToken(ROLES.USER);
        const userResponse = await requester.get(`/api/v1/subscriptions/find-all`)
            .set('Authorization', `Bearer abcd`)
            .send();
        userResponse.status.should.equal(401);

        mockGetUserFromToken(ROLES.MANAGER);
        const managerResponse = await requester.get(`/api/v1/subscriptions/find-all`)
            .set('Authorization', `Bearer abcd`)
            .send();
        managerResponse.status.should.equal(401);

        mockGetUserFromToken(ROLES.ADMIN);
        const adminResponse = await requester.get(`/api/v1/subscriptions/find-all`)
            .set('Authorization', `Bearer abcd`)
            .send();
        adminResponse.status.should.equal(401);

        mockGetUserFromToken(ROLES.SUPERADMIN);
        const superAdminResponse = await requester.get(`/api/v1/subscriptions/find-all`)
            .set('Authorization', `Bearer abcd`)
            .send();
        superAdminResponse.status.should.equal(401);
    });

    it('Finding all subscriptions has a maximum page[size] of 100, returning error for higher values', async () => {
        mockGetUserFromToken(ROLES.MICROSERVICE);

        const response = await requester
            .get(`/api/v1/subscriptions/find-all`)
            .set('Authorization', `Bearer abcd`)
            .query({ 'page[size]': 101 })
            .send();
        response.status.should.equal(400);
        response.body.should.have.property('errors').with.lengthOf(1);
    });

    it('Finding all subscriptions when there are no existing subscriptions returns a 200 OK response with no data', async () => {
        mockGetUserFromToken(ROLES.MICROSERVICE);

        const response = await requester
            .get(`/api/v1/subscriptions/find-all`)
            .set('Authorization', `Bearer abcd`)
            .send();
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(0);
    });

    it('Finding all subscriptions should return a 200 OK response with all the subscriptions', async () => {
        mockGetUserFromToken(ROLES.MICROSERVICE);

        await new Subscription(createSubscription(ROLES.USER.id)).save();
        await new Subscription(createSubscription(ROLES.MANAGER.id)).save();
        await new Subscription(createSubscription(ROLES.ADMIN.id)).save();
        await new Subscription(createSubscription(ROLES.SUPERADMIN.id)).save();
        await new Subscription(createSubscription('123')).save();

        const response = await requester
            .get(`/api/v1/subscriptions/find-all`)
            .set('Authorization', `Bearer abcd`)
            .send();
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(5);
    });

    it('Finding all subscriptions allows filtering by application query param, returns 200 OK with the correct data', async () => {
        mockGetUserFromToken(ROLES.MICROSERVICE);
        mockGetUserFromToken(ROLES.MICROSERVICE);

        const gfwSub1 = await new Subscription(createSubscription(ROLES.USER.id, null, { application: 'gfw' })).save();
        const gfwSub2 = await new Subscription(createSubscription(ROLES.MANAGER.id, null, { application: 'gfw' })).save();
        const rwSub1 = await new Subscription(createSubscription(ROLES.USER.id, null, { application: 'rw' })).save();
        const rwSub2 = await new Subscription(createSubscription(ROLES.MANAGER.id, null, { application: 'rw' })).save();

        const response1 = await requester
            .get(`/api/v1/subscriptions/find-all`)
            .set('Authorization', `Bearer abcd`)
            .query({ application: 'gfw' })
            .send();
        response1.status.should.equal(200);
        response1.body.should.have.property('data').with.lengthOf(2);
        response1.body.data.map((el) => el.id).should.contain(gfwSub1.id);
        response1.body.data.map((el) => el.id).should.contain(gfwSub2.id);

        const response2 = await requester
            .get(`/api/v1/subscriptions/find-all`)
            .set('Authorization', `Bearer abcd`)
            .query({ application: 'rw' })
            .send();
        response2.status.should.equal(200);
        response2.body.should.have.property('data').with.lengthOf(2);
        response2.body.data.map((el) => el.id).should.contain(rwSub1.id);
        response2.body.data.map((el) => el.id).should.contain(rwSub2.id);
    });

    it('Finding subscriptions allows filtering by environment query param, returns 200 OK with the correct data', async () => {
        mockGetUserFromToken(ROLES.MICROSERVICE);
        mockGetUserFromToken(ROLES.MICROSERVICE);

        const prodSub1 = await new Subscription(createSubscription(ROLES.USER.id, null, { env: 'production' })).save();
        const prodSub2 = await new Subscription(createSubscription(ROLES.MANAGER.id, null, { env: 'production' })).save();
        const stgSub1 = await new Subscription(createSubscription(ROLES.USER.id, null, { env: 'staging' })).save();
        const stgSub2 = await new Subscription(createSubscription(ROLES.MANAGER.id, null, { env: 'staging' })).save();

        const response1 = await requester
            .get(`/api/v1/subscriptions/find-all`)
            .set('Authorization', `Bearer abcd`)
            .query({ env: 'production' })
            .send();
        response1.status.should.equal(200);
        response1.body.should.have.property('data').with.lengthOf(2);
        response1.body.data.map((el) => el.id).should.contain(prodSub1.id);
        response1.body.data.map((el) => el.id).should.contain(prodSub2.id);

        const response2 = await requester
            .get(`/api/v1/subscriptions/find-all`)
            .set('Authorization', `Bearer abcd`)
            .query({ env: 'staging' })
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
