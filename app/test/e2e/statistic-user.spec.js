/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const Subscription = require('models/subscription');
const { getTestServer } = require('./src/test-server');
const {
    createAuthCases, ensureCorrectError, getDateWithDecreaseYear, getDateWithIncreaseYear
} = require('./src/utils');
const { ROLES, MOCK_USER_IDS, MOCK_USERS } = require('./src/test.constants');
const { createMockUsers } = require('./src/mock');
const { createSubscriptions, getUserAsSingleObject } = require('./src/helpers/statistic');
const chai = require('chai');

const should = chai.should();

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

        nock.cleanAll();

        statistic = await getTestServer();
        authCases.setRequester(statistic);

        Subscription.remove({}).exec();
    });

    it('Getting statistic without being authenticated should fall', authCases.isLoggedUserRequired());

    it('Getting statistic while being authenticated as USER should fall', authCases.isUserForbidden());

    it('Getting statistic while being authenticated as MANAGER should fall', authCases.isManagerForbidden());

    it('Getting statistic while being authenticated as ADMIN but with wrong apps should fall', authCases.isRightAppRequired());

    it('Getting statistic by user without start date should fall', async () => {
        const response = await statistic
            .get(url)
            .query({ end: new Date(), application: 'gfw' })
            .send({ loggedUser: ROLES.ADMIN });
        response.status.should.equal(400);
        ensureCorrectError(response.body, 'Start date required');
    });

    it('Getting statistic by user without end date should fall', async () => {
        const response = await statistic
            .get(url)
            .query({ start: new Date(), application: 'gfw' })
            .send({ loggedUser: ROLES.ADMIN });
        response.status.should.equal(400);
        ensureCorrectError(response.body, 'End date required');
    });

    it('Getting statistic by user without application should fall', async () => {
        const response = await statistic
            .get(url)
            .query({ start: new Date(), end: new Date() })
            .send({ loggedUser: ROLES.ADMIN });
        response.status.should.equal(400);
        ensureCorrectError(response.body, 'Application required');
    });

    it('Getting statistic by user should return right result (happy case)', async () => {
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
            .query({ start: startDate, end: endDate, application: 'gfw' })
            .send({ loggedUser: ROLES.ADMIN });

        const subscriptionsWithUser = subscriptionsInSearchedRange.map(([key, subscription]) => Object.assign({},
            subscription._doc,
            {
                _id: subscription._id.toString(),
                createdAt: subscription.createdAt.toISOString(),
                updateAt: subscription.updateAt.toISOString(),
                user: getUserAsSingleObject(subscription.userId),
            }));

        response.status.should.equal(200);
        response.body.should.deep.equal(subscriptionsWithUser);
    });

    afterEach(() => {
        Subscription.remove({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
