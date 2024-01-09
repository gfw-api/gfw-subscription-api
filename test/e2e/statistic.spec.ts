import nock from 'nock';
import Subscription from 'models/subscription';
import Statistic from 'models/statistic';
import chai from 'chai';
import { getTestServer } from './utils/test-server';
import { createMockUsersWithRange } from './utils/mock';
import { createExpectedGroupStatistics, createStatistics, createSubscriptions } from './utils/helpers/statistic';
import { mockValidateRequestWithApiKeyAndUserToken } from "./utils/helpers";

const {
    USERS,
    MOCK_USERS,
} = require('./utils/test.constants');
const {
    createAuthCases,
    ensureCorrectError,
    getDateWithDecreaseYear,
    getDateWithIncreaseYear,
} = require('./utils/helpers');

chai.should();

const url = '/api/v1/subscriptions/statistics';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

let requester: ChaiHttp.Agent;
const authCases = createAuthCases(url, 'get');

const assertOKStatisticsResponse = (response: Record<string, any>, expectedBody: Record<string, any>) => {
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

        requester = await getTestServer();
        authCases.setRequester(requester);
    });

    it('Getting statistic without provided user should fall', authCases.isUserRequired());

    it('Getting statistic while being authenticated as USER should fall', authCases.isUserForbidden());

    it('Getting statistic while being authenticated as MANAGER should fall', authCases.isManagerForbidden());

    it('Getting statistic while being authenticated as ADMIN but with wrong apps should fall', authCases.isRightAppRequired());

    it('Getting statistic without start date should fall', async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });

        const response = await requester.get(url)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .query({ end: new Date() });

        response.status.should.equal(400);
        ensureCorrectError(response.body, 'Start date required');
    });

    it('Getting statistic without end date should fall', async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });

        const response = await requester
            .get(url)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .query({ start: new Date() });

        response.status.should.equal(400);
        ensureCorrectError(response.body, 'End date required');
    });

    it('Getting statistic should return right result (happy case)', async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });

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

        const response = await requester
            .get(url)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test').query({
                start: startDate,
                end: endDate,
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
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });

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
        const gfwResponse = await requester.get(url)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .query({
                start: startDate,
                end: endDate,
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
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.ADMIN });

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
        const rwResponse = await requester
            .get(url)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .query({
                start: startDate,
                end: endDate,
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
