import nock from 'nock';
import Subscription from 'models/subscription';
import chai from 'chai';
import { createMockConfirmSUB } from './utils/mock';
import { USERS } from './utils/test.constants';
import { getTestServer } from './utils/test-server';
import { mockValidateRequestWithApiKey, mockValidateRequestWithApiKeyAndUserToken } from "./utils/helpers";

const {
    createSubscriptionContent,
    ensureCorrectError,
} = require('./utils/helpers');

chai.should();

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

let requester: ChaiHttp.Agent;

describe('Confirm subscription endpoint', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();

        nock.cleanAll();
    });

    it('Confirming subscription should return not found when subscription doesn\'t exist', async () => {
        mockValidateRequestWithApiKey({});
        const response = await requester
            .get('/api/v1/subscriptions/41224d776a326fb40f000001/confirm')
            .set('x-api-key', 'api-key-test')
            .send();
        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');
    });

    it('Confirming subscription should return bad request when id is not valid', async () => {
        mockValidateRequestWithApiKey({});
        const response = await requester
            .get('/api/v1/subscriptions/123/confirm')
            .set('x-api-key', 'api-key-test')
            .send();
        response.status.should.equal(400);
        ensureCorrectError(response.body, 'ID is not valid');
    });

    it('Confirming subscription should redirect to flagship and update subscription to confirmed (happy case)', async () => {
        mockValidateRequestWithApiKeyAndUserToken({});

        createMockConfirmSUB();
        const createdSubscription = await new Subscription(
            createSubscriptionContent(USERS.USER.id, null, { confirmed: false })
        ).save();

        const response = await requester
            .get(`/api/v1/subscriptions/${createdSubscription._id}/confirm`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .query({ application: 'test' })
            .send();

        response.status.should.equal(200);
        response.body.mockMessage.should.equal('Should redirect');

        const updateSubscription = await Subscription.findById(createdSubscription._id);
        updateSubscription.confirmed.should.equal(true);
    });

    afterEach(async () => {
        await Subscription.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
