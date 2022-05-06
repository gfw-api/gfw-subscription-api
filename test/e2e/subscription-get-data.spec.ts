import nock from 'nock';
import Subscription from 'models/subscription';
import chai from 'chai';
import { MOCK_FILE, ROLES } from './utils/test.constants';
import { getTestServer } from './utils/test-server';
import { createSubscription } from './utils/helpers';
import { createMockDatasetQuery } from './utils/mock';

const {
    getUUID,
    createAuthCases,
    ensureCorrectError,
    mockGetUserFromToken,
} = require('./utils/helpers');
const {
    createMockDataset
} = require('./utils/mock');

chai.should();

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

let requester: ChaiHttp.Agent;
const authCases = createAuthCases(`/api/v1/subscriptions/123/data`, 'get');

describe('GET subscription data endpoint', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();
        authCases.setRequester(requester);
    });

    it('Getting subscription data without provided user should fall', authCases.isUserRequired());

    it('Getting subscription data with being authenticated but with not existing subscription for user should fall', async () => {
        mockGetUserFromToken(ROLES.USER);

        await createSubscription(ROLES.USER.id);
        const response = await requester
            .get('/api/v1/subscriptions/41224d776a326fb40f000001/data')
            .set('Authorization', `Bearer abcd`)
            .send();
        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');
    });

    it('Getting subscription data should return not found when subscription doesn\'t exist', async () => {
        mockGetUserFromToken(ROLES.USER);

        const response = await requester
            .get('/api/v1/subscriptions/41224d776a326fb40f000001/data')
            .set('Authorization', `Bearer abcd`)
            .send();
        response.status.should.equal(404);
        ensureCorrectError(response.body, 'Subscription not found');
    });

    it('Getting subscription data should return bad request when id is not valid', async () => {
        mockGetUserFromToken(ROLES.USER);

        const response = await requester
            .get('/api/v1/subscriptions/123/data')
            .set('Authorization', `Bearer abcd`)
            .set('Authorization', `Bearer abcd`)
            .send();
        response.status.should.equal(400);
        ensureCorrectError(response.body, 'ID is not valid');
    });

    it('Getting subscription data should be returned (happy case)', async () => {
        mockGetUserFromToken(ROLES.USER);

        const datasetID = getUUID();

        const subscription = await createSubscription(ROLES.USER.id, {
            datasets: [datasetID],
            datasetsQuery: [{
                id: datasetID,
                type: 'dataset',
            }]
        });
        createMockDataset(datasetID);
        createMockDatasetQuery({
            geostore: subscription.params.geostore,
            threshold: 0,
            sql: (new Date()).toISOString().slice(0, 10)
        }, {
            data: { url: MOCK_FILE }
        });

        const response = await requester
            .get(`/api/v1/subscriptions/${subscription._id}/data`)
            .set('Authorization', `Bearer abcd`)
            .query({ application: 'rw' })
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
