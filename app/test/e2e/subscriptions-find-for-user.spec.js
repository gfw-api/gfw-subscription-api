/* eslint-disable no-unused-expressions,no-unused-vars,no-undef */
const nock = require('nock');
const chai = require('chai');
const Subscription = require('models/subscription');
const { createSubscription } = require('./utils/helpers');
const { ROLES } = require('./utils/test.constants');
const { getTestServer } = require('./utils/test-server');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

chai.should();

let requester;

describe('Find subscriptions for user tests', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();

        await Subscription.deleteMany({}).exec();
    });

    it('Finding subscriptions for users is only allowed when the request is performed by a micro service, failing with 403 Forbidden otherwise', async () => {
        const noTokenResponse = await requester
            .get(`/api/v1/subscriptions/user/1`)
            .send();
        noTokenResponse.status.should.equal(403);

        const userResponse = await requester
            .get(`/api/v1/subscriptions/user/1`)
            .query({ loggedUser: JSON.stringify(ROLES.USER) })
            .send();
        userResponse.status.should.equal(403);

        const managerResponse = await requester
            .get(`/api/v1/subscriptions/user/1`)
            .query({ loggedUser: JSON.stringify(ROLES.MANAGER) })
            .send();
        managerResponse.status.should.equal(403);

        const adminResponse = await requester
            .get(`/api/v1/subscriptions/user/1`)
            .query({ loggedUser: JSON.stringify(ROLES.ADMIN) })
            .send();
        adminResponse.status.should.equal(403);

        const superAdminResponse = await requester
            .get(`/api/v1/subscriptions/user/1`)
            .query({ loggedUser: JSON.stringify(ROLES.SUPERADMIN) })
            .send();
        superAdminResponse.status.should.equal(403);
    });

    it('Finding subscriptions for a user that does not have associated subscriptions returns a 200 OK response with no data', async () => {
        const response = await requester
            .get(`/api/v1/subscriptions/user/1`)
            .query({ loggedUser: JSON.stringify(ROLES.MICROSERVICE) })
            .send();
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(0);
    });

    it('Finding subscriptions for users by ids providing existing ids should return a 200 OK response with the subscription data', async () => {
        await new Subscription(createSubscription(ROLES.USER.id)).save();
        await new Subscription(createSubscription(ROLES.USER.id)).save();
        await new Subscription(createSubscription('123')).save();

        const response = await requester
            .get(`/api/v1/subscriptions/user/${ROLES.USER.id}`)
            .query({ loggedUser: JSON.stringify(ROLES.MICROSERVICE) })
            .send();
        response.status.should.equal(200);
        response.body.should.have.property('data').with.lengthOf(2);
        response.body.data.every((subscription) => subscription.attributes.userId === ROLES.USER.id).should.be.true;
    });

    afterEach(async () => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
    });
});
