/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const Subscription = require('models/subscription');
const Statistic = require('models/statistic');
const chai = require('chai');
const {
    ROLES,
    MOCK_USERS,
} = require('./utils/test.constants');
const { getTestServer } = require('./utils/test-server');
const {
    createAuthCases,
    ensureCorrectError,
    getDateWithDecreaseYear,
    getDateWithIncreaseYear,
} = require('./utils/helpers');
const { createMockUsersWithRange } = require('./utils/mock');
const { createSubscriptions, createExpectedGroupStatistics, createStatistics } = require('./utils/helpers/statistic');

const should = chai.should();

const url = '/api/v1/subscriptions/statistics';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

let statistic;
const authCases = createAuthCases(url, 'get');

const assertOKStatisticsResponse = (response, expectedBody) => {
    response.status.should.equal(200);
    response.body.should.have.property('info').and.instanceOf(Object);
    response.body.should.have.property('topSubscriptions').and.instanceOf(Object);
    response.body.should.have.property('groupStatistics').and.instanceOf(Object);
    response.body.should.deep.equal(expectedBody);
};

describe('Subscription statistic endpoint', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        statistic = await getTestServer();
        authCases.setRequester(statistic);

        await Subscription.deleteMany({}).exec();
        Statistic.deleteMany({}).exec();
    });

    it('Getting statistic without provide loggedUser should fall', authCases.isLoggedUserRequired());

    it('Getting statistic while being authenticated as USER should fall', authCases.isUserForbidden());

    it('Getting statistic while being authenticated as MANAGER should fall', authCases.isManagerForbidden());

    it('Getting statistic while being authenticated as ADMIN but with wrong apps should fall', authCases.isRightAppRequired());

    it('Getting statistic without start date should fall', async () => {
        const response = await statistic.get(url)
            .query({ end: new Date(), loggedUser: JSON.stringify(ROLES.ADMIN) });

        response.status.should.equal(400);
        ensureCorrectError(response.body, 'Start date required');
    });

    it('Getting statistic without end date should fall', async () => {
        const response = await statistic
            .get(url)
            .query({ start: new Date(), loggedUser: JSON.stringify(ROLES.ADMIN) });

        response.status.should.equal(400);
        ensureCorrectError(response.body, 'End date required');
    });

    it('Getting statistic should return right result (happy case)', async () => {
        const outRangeDate = getDateWithDecreaseYear(4);
        const startDate = getDateWithDecreaseYear(1);
        const endDate = getDateWithIncreaseYear(1);

        createMockUsersWithRange(startDate, endDate);

        const subscriptions = await createSubscriptions(outRangeDate);
        const statistics = await createStatistics(outRangeDate, 'gfw');

        const totalSubscriptions = Object.keys(subscriptions).length;
        const totalSubscriptionsInSearchedRange = Object.keys(subscriptions).length - 1;
        const totalUsers = MOCK_USERS.length;
        const totalUsersWithSub = MOCK_USERS.length - 1;
        const totalStatistics = statistics.length;
        const totalStatisticsInSearchedRange = statistics.length - 1;

        const response = await statistic.get(url).query({
            start: startDate,
            end: endDate,
            loggedUser: JSON.stringify(ROLES.ADMIN),
        });

        assertOKStatisticsResponse(response, {
            // created subscriptions has each type once, so there is one everywhere in topSubscriptions
            topSubscriptions: {
                geostore: 1, country: 1, region: 1, wdpa: 1, use: 1
            },
            info: {
                numSubscriptions: totalSubscriptionsInSearchedRange,
                usersWithSubscriptions: totalUsersWithSub,
                totalEmailsSentInThisQ: totalStatisticsInSearchedRange,
                totalEmailsSended: totalStatistics,
                totalSubscriptions,
            },
            usersWithSubscription: totalUsersWithSub,
            newUsers: totalUsers,
            groupStatistics: createExpectedGroupStatistics(subscriptions, response.body.groupStatistics),
        });
    });

    it('Getting statistic filtering by application "gfw" should return the right results (happy case)', async () => {
        const outRangeDate = getDateWithDecreaseYear(4);
        const startDate = getDateWithDecreaseYear(1);
        const endDate = getDateWithIncreaseYear(1);

        createMockUsersWithRange(startDate, endDate);

        const subscriptions = await createSubscriptions(outRangeDate);
        const statistics = await createStatistics(outRangeDate, 'gfw');

        const totalSubscriptions = Object.keys(subscriptions).length;
        const totalSubscriptionsInSearchedRange = Object.keys(subscriptions).length - 1;
        const totalUsers = MOCK_USERS.length;
        const totalUsersWithSub = MOCK_USERS.length - 1;
        const totalStatistics = statistics.length;
        const totalStatisticsInSearchedRange = statistics.length - 1;

        // Fetch GFW statistics
        const gfwResponse = await statistic.get(url).query({
            start: startDate,
            end: endDate,
            loggedUser: JSON.stringify(ROLES.ADMIN),
            application: 'gfw',
        });

        assertOKStatisticsResponse(gfwResponse, {
            topSubscriptions: {
                geostore: 1, country: 1, region: 1, wdpa: 1, use: 1
            },
            info: {
                numSubscriptions: totalSubscriptionsInSearchedRange,
                usersWithSubscriptions: totalUsersWithSub,
                totalEmailsSentInThisQ: totalStatisticsInSearchedRange,
                totalEmailsSended: totalStatistics,
                totalSubscriptions,
            },
            usersWithSubscription: totalUsersWithSub,
            newUsers: totalUsers,
            groupStatistics: createExpectedGroupStatistics(subscriptions, gfwResponse.body.groupStatistics),
        });
    });

    it('Getting statistic filtering by application "rw" should return the right results (happy case)', async () => {
        const outRangeDate = getDateWithDecreaseYear(4);
        const startDate = getDateWithDecreaseYear(1);
        const endDate = getDateWithIncreaseYear(1);

        const subscriptions = await createSubscriptions(outRangeDate);
        const statistics = await createStatistics(outRangeDate, 'gfw');

        const totalSubscriptions = Object.keys(subscriptions).length;
        const totalUsers = MOCK_USERS.length;
        const totalStatistics = statistics.length;

        createMockUsersWithRange(startDate, endDate);

        // Fetch RW statistics
        const rwResponse = await statistic.get(url).query({
            start: startDate,
            end: endDate,
            loggedUser: JSON.stringify(ROLES.ADMIN),
            application: 'rw',
        });

        assertOKStatisticsResponse(rwResponse, {
            topSubscriptions: {
                geostore: 0, country: 0, region: 0, wdpa: 0, use: 0
            },
            info: {
                numSubscriptions: 0,
                usersWithSubscriptions: 0,
                totalEmailsSentInThisQ: 0,
                totalEmailsSended: totalStatistics,
                totalSubscriptions,
            },
            usersWithSubscription: 0,
            newUsers: totalUsers,
            groupStatistics: {},
        });
    });

    afterEach(async () => {
        await Statistic.deleteMany({}).exec();
        await Subscription.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
