import nock from 'nock';
import chai from 'chai';
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

describe('Find subscriptions by ids tests', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();
    });

    it('Finding subscriptions is only allowed when the request is performed by a micro service, failing with 401 Unauthorized otherwise', async () => {
        mockValidateRequestWithApiKey({});
        const noTokenResponse = await requester
            .post(`/api/v1/subscriptions/find-by-ids`)
            .set('x-api-key', 'api-key-test')
            .send();
        noTokenResponse.status.should.equal(401);

        mockValidateRequestWithApiKeyAndUserToken({});
        const userResponse = await requester.post(`/api/v1/subscriptions/find-by-ids`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send({});
        userResponse.status.should.equal(401);

        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MANAGER });
        const managerResponse = await requester.post(`/api/v1/subscriptions/find-by-ids`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send({});
        managerResponse.status.should.equal(401);

        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });
        const adminResponse = await requester.post(`/api/v1/subscriptions/find-by-ids`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send({});
        adminResponse.status.should.equal(401);
    });

    it('Finding subscriptions providing wrong type data (non-string ids) returns a 200 OK response with no data', async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MICROSERVICE });

        const response = await requester
            .post(`/api/v1/subscriptions/find-by-ids`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send({ ids: [{}] });
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(0);
    });

    it('Finding subscriptions by ids without providing ids returns 400 Bad Request requiring the ids', async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MICROSERVICE });

        const response = await requester.post(`/api/v1/subscriptions/find-by-ids`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send({});
        response.status.should.equal(400);
        response.body.should.have.property('errors').with.lengthOf(1);
        response.body.errors[0].should.have.property('detail').and.be.equal('Ids not provided.');
    });

    it('Finding subscriptions by ids providing invalid ids should return a 200 OK response with no data', async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MICROSERVICE });

        const response = await requester
            .post(`/api/v1/subscriptions/find-by-ids`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send({ ids: ['non-existing-id'] });
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(0);
    });

    it('Finding subscriptions by ids providing existing ids should return a 200 OK response with the subscription data', async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MICROSERVICE });

        const subscriptionOne = await createSubscription(USERS.USER.id);
        const subscriptionTwo = await createSubscription(USERS.USER.id);

        const response = await requester
            .post(`/api/v1/subscriptions/find-by-ids`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send({ ids: [subscriptionOne.id, subscriptionTwo.id] });
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(2);
        response.body.data.map((e: Record<string, any>) => e.id).should.have.members([subscriptionOne.id.toString(), subscriptionTwo.id.toString()]);
    });

    it('Finding subscriptions by ids providing a mix of valid and invalid ids should return a 200 OK response with only the subscription data for valid ids', async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MICROSERVICE });

        const subscriptionOne = await createSubscription(USERS.USER.id);
        const subscriptionTwo = await createSubscription(USERS.USER.id);

        const response = await requester
            .post(`/api/v1/subscriptions/find-by-ids`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send({ ids: [subscriptionOne.id, subscriptionTwo.id, 'invalid-id'] });
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(2);
        response.body.data.map((e: Record<string, any>) => e.id).should.have.members([subscriptionOne.id.toString(), subscriptionTwo.id.toString()]);
    });

    afterEach(async () => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
    });
});
