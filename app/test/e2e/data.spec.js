/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const Subscription = require('models/subscription');
const chai = require('chai');
const {
    createSubInDB,
    getUUID,
    createAuthCases,
    ensureCorrectError,
} = require('./utils/helpers');
const {
    createMockDataset,
    createMockQuery
} = require('./utils/mock');
const { ROLES, MOCK_FILE } = require('./utils/test.constants');
const { createRequest } = require('./utils/test-server');

const should = chai.should();

const prefix = '/api/v1/subscriptions';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

let subscription;
const authCases = createAuthCases(`/123/data`, 'get');

describe('Get subscription endpoint', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        subscription = await createRequest(prefix, 'get');
        authCases.setRequester(subscription);

        await Subscription.deleteMany({}).exec();
    });

    it('Getting subscription data without provide loggedUser should fall', authCases.isLoggedUserRequired());

    it('Getting subscription data with provide loggedUser as not valid json string should fall', authCases.isLoggedUserJSONString());

    it('Getting subscription data with provide loggedUser as not an object json string should fall', authCases.isLoggedUserJSONObject());

    it('Getting subscription data with being authenticated but with not existing subscription for user should fall', async () => {
        await createSubInDB(ROLES.USER.id, getUUID());
        const response = await subscription
            .get('/41224d776a326fb40f000001/data')
            .query({ loggedUser: JSON.stringify(ROLES.USER) })
            .send();
        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');
    });

    it('Getting subscription data should return not found when subscription doesn\'t exist', async () => {
        const response = await subscription
            .get('/41224d776a326fb40f000001/data')
            .query({ loggedUser: JSON.stringify(ROLES.USER) })
            .send();
        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');
    });

    it('Getting subscription data should return bad request when id is not valid', async () => {
        const response = await subscription
            .get('/123/data')
            .query({ loggedUser: JSON.stringify(ROLES.USER) })
            .send();
        response.status.should.equal(400);
        ensureCorrectError(response.body, 'ID is not valid');
    });

    it('Getting subscription data should be returned (happy case)', async () => {
        const datasetID = getUUID();
        createMockDataset(datasetID);
        createMockQuery();

        const datasetQuery = {
            datasetsQuery: [{
                id: datasetID,
                type: 'dataset',
            }]
        };

        const createdSubscription = await createSubInDB(ROLES.USER.id, datasetID, datasetQuery);
        const response = await subscription
            .get(`/${createdSubscription._id}/data`)
            .query({ loggedUser: JSON.stringify(ROLES.USER), application: 'rw' })
            .send();

        response.status.should.equal(200);
        response.body.data[0].should.have.property(datasetID).and.instanceOf(Object);
        response.body.data[0][datasetID].type.should.equal('dataset');
        response.body.data[0][datasetID].should.have.property('data').and.instanceOf(Object);
        response.body.data[0][datasetID].data.url.should.equal(MOCK_FILE);
    });

    afterEach(async () => {
        await Subscription.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
