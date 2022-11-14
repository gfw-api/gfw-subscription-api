import nock from 'nock';
import Subscription from 'models/subscription';
import chai from 'chai';
import { getTestServer } from './utils/test-server';
import { ROLES } from './utils/test.constants';
import { createSubscription } from './utils/helpers';
const {
    ensureCorrectError, getUUID, createAuthCases, mockGetUserFromToken
} = require('./utils/helpers');

chai.should();

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

let requester: ChaiHttp.Agent;
const authCases = createAuthCases('/api/v1/subscriptions/by-user/123', 'delete');

describe('Delete subscription by user id endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();
        authCases.setRequester(requester);
    });

    it('Deleting subscriptions by user id without provided user should fail', authCases.isUserRequired());


    it('Deleting subscriptions by user id of a different user from current user or not admin should return 403 Forbidden', async () => {
        mockGetUserFromToken(ROLES.USER);
        const createdSubscription = await createSubscription(ROLES.MANAGER.id);

        const response = await requester
            .delete(`/api/v1/subscriptions/by-user/${ROLES.MANAGER.id}`)
            .set('Authorization', `Bearer abcd`);

        response.status.should.equal(403);
        ensureCorrectError(response.body, 'Forbidden');

        const foundSubscription = await Subscription.findById(createdSubscription._id);
        foundSubscription._id.toString().should.equal(createdSubscription._id.toString());
    });

    it('Deleting subscription by user id from the current user should return the subscriptions and delete them (happy case)', async () => {
        mockGetUserFromToken(ROLES.USER);

        const createdSubscriptionOne = await createSubscription(ROLES.USER.id);
        const createdSubscriptionTwo = await createSubscription(ROLES.USER.id);
        const createdSubscriptionAdmin = await createSubscription(ROLES.ADMIN.id);
        const createdSubscriptionManager = await createSubscription(ROLES.MANAGER.id);

        const response = await requester
            .delete(`/api/v1/subscriptions/by-user/${ROLES.USER.id}`)
            .set('Authorization', `Bearer abcd`);

        response.status.should.equal(200);

        response.body.should.have.property('data').and.lengthOf(2);
        const { data } = response.body;
        data.map((elem: any) => elem.id).sort().should.deep.equal([createdSubscriptionOne.id.toString(), createdSubscriptionTwo.id.toString()].sort());

        const userSubscriptions = await Subscription.find({ userId: { $eq: ROLES.USER.id }});
        userSubscriptions.should.have.lengthOf(0);

        const findAllSubscriptions = await Subscription.find({}).exec();
        findAllSubscriptions.should.be.an('array').with.lengthOf(2);

        const subscriptionNames = findAllSubscriptions.map((sub) => sub.name);
        subscriptionNames.should.contain(createdSubscriptionAdmin.name);
        subscriptionNames.should.contain(createdSubscriptionManager.name);
    });

    it('Deleting subscription by user id as an ADMIN should return the subscriptions and delete them', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        const createdSubscriptionOne = await createSubscription(ROLES.USER.id);
        const createdSubscriptionTwo = await createSubscription(ROLES.USER.id);
        const createdSubscriptionAdmin = await createSubscription(ROLES.ADMIN.id);
        const createdSubscriptionManager = await createSubscription(ROLES.MANAGER.id);

        const response = await requester
            .delete(`/api/v1/subscriptions/by-user/${ROLES.USER.id}`)
            .set('Authorization', `Bearer abcd`);

        response.status.should.equal(200);

        response.body.should.have.property('data').and.lengthOf(2);
        const { data } = response.body;
        data.map((elem: any) => elem.id).sort().should.deep.equal([createdSubscriptionOne.id.toString(), createdSubscriptionTwo.id.toString()].sort());

        const findAllSubscriptions = await Subscription.find({}).exec();
        findAllSubscriptions.should.be.an('array').with.lengthOf(2);

        const subscriptionNames = findAllSubscriptions.map((sub) => sub.name);
        subscriptionNames.should.contain(createdSubscriptionAdmin.name);
        subscriptionNames.should.contain(createdSubscriptionManager.name);
    });

    it('Deleting subscription by user id as a microservice should return the subscriptions and delete them', async () => {
        mockGetUserFromToken(ROLES.MICROSERVICE);

        const createdSubscriptionOne = await createSubscription(ROLES.USER.id);
        const createdSubscriptionTwo = await createSubscription(ROLES.USER.id);
        const createdSubscriptionAdmin = await createSubscription(ROLES.ADMIN.id);
        const createdSubscriptionManager = await createSubscription(ROLES.MANAGER.id);

        const response = await requester
            .delete(`/api/v1/subscriptions/by-user/${ROLES.USER.id}`)
            .set('Authorization', `Bearer abcd`);

        response.status.should.equal(200);

        response.body.should.have.property('data').and.lengthOf(2);
        const { data } = response.body;
        data.map((elem: any) => elem.id).sort().should.deep.equal([createdSubscriptionOne.id.toString(), createdSubscriptionTwo.id.toString()].sort());

        const findAllSubscriptions = await Subscription.find({}).exec();
        findAllSubscriptions.should.be.an('array').with.lengthOf(2);

        const subscriptionNames = findAllSubscriptions.map((sub) => sub.name);
        subscriptionNames.should.contain(createdSubscriptionAdmin.name);
        subscriptionNames.should.contain(createdSubscriptionManager.name);
    });

    it('Deleting subscriptions from a user should delete them completely from a database (large number of subscriptions)', async () => {
        mockGetUserFromToken(ROLES.USER);

        await Promise.all([...Array(100)].map(async () => {
            await createSubscription(ROLES.USER.id);
        }));

        const deleteResponse = await requester
            .delete(`/api/v1/subscriptions/by-user/${ROLES.USER.id}`)
            .set('Authorization', `Bearer abcd`)
            .send();

        deleteResponse.status.should.equal(200);
        deleteResponse.body.should.have.property('data').with.lengthOf(100);

        const findCollectionByUser = await Subscription.find({ userId: { $eq: ROLES.USER.id }}).exec();
        findCollectionByUser.should.be.an('array').with.lengthOf(0);
    });

    it('Deleting all subscriptions of an user while being authenticated as USER should return a 200 and all subscriptions deleted - no subscriptions in the db', async () => {
        mockGetUserFromToken(ROLES.USER);

        const response = await requester
            .delete(`/api/v1/subscriptions/by-user/${ROLES.USER.id}`)
            .set('Authorization', 'Bearer abcd')
            .send();

        response.status.should.equal(200);
        response.body.data.should.be.an('array').with.lengthOf(0);
    });


    afterEach(async () => {
        await Subscription.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
