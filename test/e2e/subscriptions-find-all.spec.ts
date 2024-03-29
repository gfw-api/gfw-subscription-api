import nock from 'nock';
import chai from 'chai';
import config from 'config';
import Subscription from 'models/subscription';
import {
    createSubscription,
    mockValidateRequestWithApiKey,
    mockValidateRequestWithApiKeyAndUserToken
} from './utils/helpers';
import { USERS } from './utils/test.constants';
import { getTestServer } from './utils/test-server';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

chai.should();

let requester: ChaiHttp.Agent;

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
            mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MICROSERVICE });

            const response = await requester
                .get(`/api/v1/subscriptions/find-all`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test');

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
            mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MICROSERVICE });

            const response = await requester
                .get(`/api/v1/subscriptions/find-all`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
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
            mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MICROSERVICE });

            const response = await requester
                .get(`/api/v1/subscriptions/find-all`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
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
            mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MICROSERVICE });

            const response = await requester
                .get(`/api/v1/subscriptions/find-all`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
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
        mockValidateRequestWithApiKey({});
        const noTokenResponse = await requester
            .get(`/api/v1/subscriptions/find-all`)
            .set('x-api-key', 'api-key-test')
            .send();

        noTokenResponse.status.should.equal(401);

        mockValidateRequestWithApiKeyAndUserToken({});
        const userResponse = await requester.get(`/api/v1/subscriptions/find-all`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send();
        userResponse.status.should.equal(401);

        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MANAGER });
        const managerResponse = await requester.get(`/api/v1/subscriptions/find-all`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send();
        managerResponse.status.should.equal(401);

        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });
        const adminResponse = await requester.get(`/api/v1/subscriptions/find-all`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send();
        adminResponse.status.should.equal(401);
    });

    it('Finding all subscriptions has a maximum page[size] of 100, returning error for higher values', async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MICROSERVICE });

        const response = await requester
            .get(`/api/v1/subscriptions/find-all`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .query({ 'page[size]': 101 })
            .send();
        response.status.should.equal(400);
        response.body.should.have.property('errors').with.lengthOf(1);
    });

    it('Finding all subscriptions when there are no existing subscriptions returns a 200 OK response with no data', async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MICROSERVICE });

        const response = await requester
            .get(`/api/v1/subscriptions/find-all`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send();
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(0);
    });

    it('Finding all subscriptions should return a 200 OK response with all the subscriptions', async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MICROSERVICE });

        await createSubscription(USERS.USER.id);
        await createSubscription(USERS.MANAGER.id);
        await createSubscription(USERS.ADMIN.id);
        await createSubscription('123');

        const response = await requester
            .get(`/api/v1/subscriptions/find-all`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send();
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(4);
    });

    it('Finding all subscriptions allows filtering by application query param, returns 200 OK with the correct data', async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MICROSERVICE });
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MICROSERVICE });

        const gfwSub1 = await createSubscription(USERS.USER.id, { application: 'gfw' });
        const gfwSub2 = await createSubscription(USERS.MANAGER.id, { application: 'gfw' });
        const rwSub1 = await createSubscription(USERS.USER.id, { application: 'rw' });
        const rwSub2 = await createSubscription(USERS.MANAGER.id, { application: 'rw' });

        const response1 = await requester
            .get(`/api/v1/subscriptions/find-all`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .query({ application: 'gfw' })
            .send();
        response1.status.should.equal(200);
        response1.body.should.have.property('data').with.lengthOf(2);
        response1.body.data.map((el: Record<string, any>) => el.id).should.contain(gfwSub1.id);
        response1.body.data.map((el: Record<string, any>) => el.id).should.contain(gfwSub2.id);

        const response2 = await requester
            .get(`/api/v1/subscriptions/find-all`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .query({ application: 'rw' })
            .send();
        response2.status.should.equal(200);
        response2.body.should.have.property('data').with.lengthOf(2);
        response2.body.data.map((el: Record<string, any>) => el.id).should.contain(rwSub1.id);
        response2.body.data.map((el: Record<string, any>) => el.id).should.contain(rwSub2.id);
    });

    describe('Environments', () => {
        it('Finding subscriptions without an env filter returns 200 OK with all subscriptions with production env', async () => {
            mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MICROSERVICE });

            const prodSub1 = await createSubscription(USERS.USER.id);
            const prodSub2 = await createSubscription(USERS.MANAGER.id, { env: 'production' });
            await createSubscription(USERS.USER.id, { env: 'staging' });
            await createSubscription(USERS.MANAGER.id, { env: 'staging' });

            const response = await requester
                .get(`/api/v1/subscriptions/find-all`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .send();
            response.status.should.equal(200);
            response.body.should.have.property('data').with.lengthOf(2);
            response.body.data.map((el: Record<string, any>) => el.id).should.contain(prodSub1.id);
            response.body.data.map((el: Record<string, any>) => el.id).should.contain(prodSub2.id);
        });

        it('Finding subscriptions with all env filter returns 200 OK with all subscriptions from every env', async () => {
            mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MICROSERVICE });

            await createSubscription(USERS.USER.id);
            await createSubscription(USERS.MANAGER.id, { env: 'production' });
            await createSubscription(USERS.USER.id, { env: 'staging' });
            await createSubscription(USERS.MANAGER.id, { env: 'staging' });

            const response = await requester
                .get(`/api/v1/subscriptions/find-all`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .query({ env: 'all' })
                .send();
            response.status.should.equal(200);
            response.body.should.have.property('data').with.lengthOf(4);
            [...new Set(response.body.data.map((elem: Record<string, any>) => elem.attributes.env))].sort().should.eql(['production', 'staging'].sort());
        });

        it('Finding subscriptions allows filtering by environment query param, returns 200 OK with the correct data', async () => {
            mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MICROSERVICE });
            mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MICROSERVICE });

            const prodSub1 = await createSubscription(USERS.USER.id, { env: 'production' });
            const prodSub2 = await createSubscription(USERS.MANAGER.id, { env: 'production' });
            const stgSub1 = await createSubscription(USERS.USER.id, { env: 'staging' });
            const stgSub2 = await createSubscription(USERS.MANAGER.id, { env: 'staging' });

            const response1 = await requester
                .get(`/api/v1/subscriptions/find-all`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .query({ env: 'production' })
                .send();
            response1.status.should.equal(200);
            response1.body.should.have.property('data').with.lengthOf(2);
            response1.body.data.map((el: Record<string, any>) => el.id).should.contain(prodSub1.id);
            response1.body.data.map((el: Record<string, any>) => el.id).should.contain(prodSub2.id);

            const response2 = await requester
                .get(`/api/v1/subscriptions/find-all`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .query({ env: 'staging' })
                .send();
            response2.status.should.equal(200);
            response2.body.should.have.property('data').with.lengthOf(2);
            response2.body.data.map((el: Record<string, any>) => el.id).should.contain(stgSub1.id);
            response2.body.data.map((el: Record<string, any>) => el.id).should.contain(stgSub2.id);
        });

        it('Finding subscriptions allows filtering by multiple environments as a comma separated query param, returns 200 OK with the correct data', async () => {
            mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MICROSERVICE });

            const prodSub1 = await createSubscription(USERS.USER.id, { env: 'production' });
            const prodSub2 = await createSubscription(USERS.MANAGER.id, { env: 'production' });
            const stgSub1 = await createSubscription(USERS.USER.id, { env: 'staging' });
            const stgSub2 = await createSubscription(USERS.MANAGER.id, { env: 'staging' });

            const response = await requester
                .get(`/api/v1/subscriptions/find-all`)
                .set('Authorization', `Bearer abcd`)
                .set('x-api-key', 'api-key-test')
                .query({ env: ['production', 'staging'].join(',') })
                .send();
            response.status.should.equal(200);
            response.body.should.have.property('data').with.lengthOf(4);
            response.body.data.map((el: Record<string, any>) => el.id).should.contain(prodSub1.id);
            response.body.data.map((el: Record<string, any>) => el.id).should.contain(prodSub2.id);
            response.body.data.map((el: Record<string, any>) => el.id).should.contain(stgSub1.id);
            response.body.data.map((el: Record<string, any>) => el.id).should.contain(stgSub2.id);
        });
    });

    afterEach(async () => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
    });
});
