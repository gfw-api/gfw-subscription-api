import nock from 'nock';
import Subscription from 'models/subscription';
import { expect } from 'chai';
import { omit } from 'lodash';
import chai from 'chai';
import { getTestServer } from './utils/test-server';
import { USERS } from './utils/test.constants';
import { createSubscription, mockValidateRequestWithApiKeyAndUserToken } from './utils/helpers';
const {
    ensureCorrectError, getUUID, createAuthCases
} = require('./utils/helpers');

chai.should();

const prefix = '/api/v1/subscriptions/';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

let requester: ChaiHttp.Agent;
const authCases = createAuthCases('/api/v1/subscriptions/123', 'delete');

describe('Delete subscription endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();
        authCases.setRequester(requester);
    });

    it('Deleting subscription without provided user should fall', authCases.isUserRequired());

    it('Deleting subscription with provided user but with not existing subscription for user should fall', async () => {
        mockValidateRequestWithApiKeyAndUserToken({});

        await createSubscription(getUUID());
        const response = await requester
            .delete('/api/v1/subscriptions/41224d776a326fb40f000001')
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test');

        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');
    });

    it('Deleting subscription should return not found when subscription doesn\'t exist', async () => {
        mockValidateRequestWithApiKeyAndUserToken({});

        const response = await requester
            .delete('/api/v1/subscriptions/41224d776a326fb40f000001')
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test');

        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');
    });

    it('Deleting subscription should return bad request when id is not valid', async () => {
        mockValidateRequestWithApiKeyAndUserToken({});

        const response = await requester
            .delete('/api/v1/subscriptions/123')
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test');

        response.status.should.equal(400);
        ensureCorrectError(response.body, 'ID is not valid');
    });

    it('Deleting subscription should return subscription and delete it (happy case)', async () => {
        mockValidateRequestWithApiKeyAndUserToken({});

        const createdSubscription = await createSubscription(USERS.USER.id);
        const response = await requester
            .delete(`/api/v1/subscriptions/${createdSubscription._id}`)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test');

        response.status.should.equal(200);
        response.body.should.have.property('data').and.instanceOf(Object);
        const { data } = response.body;

        data.type.should.equal('subscription');
        data.id.should.equal(createdSubscription._id.toString());
        data.should.have.property('attributes').and.instanceOf(Object);

        // omit fields which are not present to user from response body and convert the createdAt to ISO string
        const expectedSubscription = omit({
            // eslint-disable-next-line no-underscore-dangle
            ...createdSubscription.toObject(),
            createdAt: createdSubscription.createdAt.toISOString(),
        }, ['_id', 'updatedAt', 'application', '__v']);
        data.attributes.should.deep.equal(expectedSubscription);

        const subscriptions = await Subscription.find({});
        expect(subscriptions).to.be.length(0);
    });

    afterEach(async () => {
        await Subscription.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
