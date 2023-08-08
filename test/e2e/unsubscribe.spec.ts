import nock from 'nock';
import Subscription from 'models/subscription';
import chai from 'chai';
import { createMockUnsubscribeSUB } from './utils/mock';
import { USERS } from './utils/test.constants';
import { getTestServer } from './utils/test-server';
import {
    createSubscription,
    mockValidateRequestWithApiKey,
    mockValidateRequestWithApiKeyAndUserToken
} from './utils/helpers';

const {
    createSubscriptionContent,
    ensureCorrectError,
} = require('./utils/helpers');

chai.should();

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

let requester: ChaiHttp.Agent;

describe('Unsubscribe endpoint', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }
        nock.cleanAll();

        requester = await getTestServer();
    });

    it('Unsubscribe should return not found when subscription doesn\'t exist', async () => {
        mockValidateRequestWithApiKey({});
        const response = await requester
            .get('/api/v1/subscriptions/41224d776a326fb40f000001/unsubscribe')
            .set('x-api-key', 'api-key-test')
            .send();
        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');
    });

    it('Unsubscribe should return bad request when id is not valid', async () => {
        mockValidateRequestWithApiKey({});
        const response = await requester
            .get('/api/v1/subscriptions/123/unsubscribe')
            .set('x-api-key', 'api-key-test')
            .send();
        response.status.should.equal(400);
        ensureCorrectError(response.body, 'ID is not valid');
    });

    it('Unsubscribe subscription should return deleted subscription (happy case)', async () => {
        mockValidateRequestWithApiKeyAndUserToken({});

        const subData = createSubscriptionContent(USERS.USER.id);

        const createdSubscription = await new Subscription(subData).save();
        const response = await requester
            .get(`/api/v1/subscriptions/${createdSubscription._id}/unsubscribe`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .query({ application: 'test' })
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
        subData.env = 'production';
        subData.datasetsQuery = attributes.datasetsQuery;
        subData.language = attributes.language;

        attributes.should.deep.equal(subData);
    });

    it('Unsubscribe subscription with query param redirect should redirect to flagship (happy case)', async () => {
        mockValidateRequestWithApiKeyAndUserToken({});

        createMockUnsubscribeSUB();
        const createdSubscription = await createSubscription(USERS.USER.id);
        const response = await requester
            .get(`/api/v1/subscriptions/${createdSubscription._id}/unsubscribe`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .query({ application: 'test', redirect: true })
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
