const nock = require('nock');
const Subscription = require('models/subscription');
const chai = require('chai');
const { getTestServer } = require('./utils/test-server');
const {
    createAuthCases, ensureCorrectError, getDateWithDecreaseYear, getDateWithIncreaseYear, mockGetUserFromToken
} = require('./utils/helpers');
const { ROLES, MOCK_USER_IDS } = require('./utils/test.constants');
const { createMockUsers } = require('./utils/mock');
const { createSubscriptions, getUserAsSingleObject } = require('./utils/helpers/statistic');

chai.should();

const url = '/api/v1/subscriptions/statistics-by-user';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

let statistic;
const authCases = createAuthCases(url, 'get');

describe('Subscription statistic by user endpoint', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        statistic = await getTestServer();
        authCases.setRequester(statistic);

        await Subscription.deleteMany({}).exec();
    });

    it('Getting statistic without being authenticated should fall', authCases.isUserRequired());

    it('Getting statistic while being authenticated as USER should fall', authCases.isUserForbidden());

    it('Getting statistic while being authenticated as MANAGER should fall', authCases.isManagerForbidden());

    it('Getting statistic while being authenticated as ADMIN but with wrong apps should fall', authCases.isRightAppRequired());

    it('Getting statistic by user without start date should fall', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        const response = await statistic
            .get(url)
            .set('Authorization', `Bearer abcd`)
            .query({ end: new Date(), application: 'gfw' });

        response.status.should.equal(400);
        ensureCorrectError(response.body, 'Start date required');
    });

    it('Getting statistic by user without end date should fall', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        const response = await statistic
            .get(url)
            .set('Authorization', `Bearer abcd`)
            .query({ start: new Date(), application: 'gfw' });

        response.status.should.equal(400);
        ensureCorrectError(response.body, 'End date required');
    });

    it('Getting statistic by user without application should fall', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        const response = await statistic
            .get(url)
            .set('Authorization', `Bearer abcd`)
            .query({ start: new Date(), end: new Date() });

        response.status.should.equal(400);
        ensureCorrectError(response.body, 'Application required');
    });

    it('Getting statistic by user should return right result (happy case)', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        const outRangeDate = getDateWithDecreaseYear(4);
        const startDate = getDateWithDecreaseYear(1);
        const endDate = getDateWithIncreaseYear(1);

        // remove last user id, because the last user hasn't subscription.
        createMockUsers(MOCK_USER_IDS.slice(0, -1));

        const subscriptions = await createSubscriptions(outRangeDate);

        // remove last subscription, because it is out of searched range.
        const subscriptionsInSearchedRange = Object.entries(subscriptions).slice(0, -1);

        const response = await statistic
            .get(url)
            .set('Authorization', `Bearer abcd`)
            .query({
                start: startDate, end: endDate, application: 'gfw'
            });

        const subscriptionsWithUser = subscriptionsInSearchedRange.map(([, subscription]) => ({
            // eslint-disable-next-line no-underscore-dangle
            ...subscription._doc,
            _id: subscription._id.toString(),
            createdAt: subscription.createdAt.toISOString(),
            updateAt: subscription.updateAt.toISOString(),
            user: getUserAsSingleObject(subscription.userId),
        }));

        response.status.should.equal(200);
        response.body.should.deep.equal(subscriptionsWithUser);
    });

    afterEach(async () => {
        await Subscription.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
