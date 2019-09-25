/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const Subscription = require('models/subscription');
const Statistic = require('models/stadistic');
const { getTestServer } = require('./utils/test-server');
const {
    createAuthCases, ensureCorrectError, getDateWithDecreaseYear, getDateWithIncreaseYear
} = require('./utils/helpers');
const { ROLES } = require('./utils/test.constants');
const { createMockUsersWithRange } = require('./utils/mock');
const { createSubscriptions, createExpectedGroupStatistics } = require('./utils/helpers/statistic');
const chai = require('chai');

const should = chai.should();

const url = '/api/v1/subscriptions/statistics-group';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

let statistic;
const authCases = createAuthCases(url, 'get');

describe('Subscription group statistic endpoint', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        statistic = await getTestServer();
        authCases.setRequester(statistic);

        Subscription.remove({}).exec();
    });

    it('Getting group statistic without being authenticated should fall', authCases.isLoggedUserRequired());

    it('Getting group statistic while being authenticated as USER should fall', authCases.isUserForbidden());

    it('Getting group statistic while being authenticated as MANAGER should fall', authCases.isManagerForbidden());

    it('Getting group statistic while being authenticated as ADMIN but with wrong apps should fall', authCases.isRightAppRequired());

    it('Getting group statistic without start date should fall', async () => {
        const response = await statistic
            .get(url)
            .query({ end: new Date(), application: 'gfw' })
            .send({ loggedUser: ROLES.ADMIN });
        response.status.should.equal(400);
        ensureCorrectError(response.body, 'Start date required');
    });

    it('Getting group statistic without end date should fall', async () => {
        const response = await statistic
            .get(url)
            .query({ start: new Date(), application: 'gfw' })
            .send({ loggedUser: ROLES.ADMIN });
        response.status.should.equal(400);
        ensureCorrectError(response.body, 'End date required');
    });

    it('Getting group statistic without application should fall', async () => {
        const response = await statistic
            .get(url)
            .query({ start: new Date(), end: new Date() })
            .send({ loggedUser: ROLES.ADMIN });
        response.status.should.equal(400);
        ensureCorrectError(response.body, 'Application required');
    });

    it('Getting group statistic should return right result (happy case)', async () => {
        const outRangeDate = getDateWithDecreaseYear(4);
        const startDate = getDateWithDecreaseYear(1);
        const endDate = getDateWithIncreaseYear(1);

        const subscriptions = await createSubscriptions(outRangeDate);

        const response = await statistic
            .get(url)
            .query({ start: startDate, end: endDate, application: 'gfw' })
            .send({ loggedUser: ROLES.ADMIN });

        response.status.should.equal(200);
        response.body.should.deep.equal(createExpectedGroupStatistics(subscriptions, response.body));
    });

    afterEach(() => {
        Subscription.remove({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
