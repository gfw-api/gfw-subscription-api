import nock from 'nock';
import chai from 'chai';
import Subscription from 'models/subscription';
import { createSubscription, getUUID, mockGetUserFromToken } from './utils/helpers';
import { ROLES } from './utils/test.constants';
import { getTestServer } from './utils/test-server';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();

let requester: ChaiHttp.Agent;

describe('Get subscriptions tests', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();

        await Subscription.deleteMany({}).exec();
    });

    it('Get all subscriptions as an anonymous user should return an "unauthorized" error with matching 401 HTTP code', async () => {
        const response = await requester.get(`/api/v1/subscriptions`).send();

        response.status.should.equal(401);
        response.body.should.have.property('errors').and.be.an('array').and.length(1);
        response.body.errors[0].should.have.property('status').and.equal(401);
        response.body.errors[0].should.have.property('detail').and.equal('Unauthorized');
    });

    it('Get all subscriptions as an authenticated user should return an empty list', async () => {
        mockGetUserFromToken(ROLES.USER);

        const response = await requester
            .get(`/api/v1/subscriptions`)
            .set('Authorization', `Bearer abcd`)
            .send();

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(0);
    });

    it('Get all subscriptions should be successful and return a list of subscriptions (populated db)', async () => {
        mockGetUserFromToken(ROLES.USER);

        const subscriptionOne = await createSubscription(ROLES.USER.id);
        const subscriptionTwo = await createSubscription(ROLES.USER.id);
        await createSubscription(getUUID());

        const response = await requester
            .get(`/api/v1/subscriptions`)
            .set('Authorization', `Bearer abcd`)
            .send();

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(2);

        const responseSubscriptionOne = response.body.data[0];
        const responseSubscriptionTwo = response.body.data[1];

        responseSubscriptionOne.id.should.equal(subscriptionOne.id);
        responseSubscriptionOne.attributes.name.should.equal(subscriptionOne.name);
        responseSubscriptionOne.attributes.datasets.should.be.an('array').and.length(1).and.contains(subscriptionOne.datasets[0]);
        responseSubscriptionOne.attributes.datasetsQuery.should.be.an('array').and.length(0);
        responseSubscriptionOne.attributes.params.should.be.an('object').and.deep.equal({ geostore: 'agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw' });
        responseSubscriptionOne.attributes.userId.should.equal(subscriptionOne.userId);
        responseSubscriptionOne.attributes.confirmed.should.equal(subscriptionOne.confirmed);
        responseSubscriptionOne.attributes.resource.should.be.an('object');
        responseSubscriptionOne.attributes.resource.type.should.equal('EMAIL');

        responseSubscriptionTwo.id.should.equal(subscriptionTwo.id);
        responseSubscriptionTwo.attributes.name.should.equal(subscriptionTwo.name);
        responseSubscriptionTwo.attributes.datasets.should.be.an('array').and.length(1).and.contains(subscriptionTwo.datasets[0]);
        responseSubscriptionTwo.attributes.datasetsQuery.should.be.an('array').and.length(0);
        responseSubscriptionTwo.attributes.params.should.be.an('object').and.deep.equal({ geostore: 'agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw' });
        responseSubscriptionTwo.attributes.userId.should.equal(subscriptionTwo.userId);
        responseSubscriptionTwo.attributes.confirmed.should.equal(subscriptionTwo.confirmed);
        responseSubscriptionTwo.attributes.resource.should.be.an('object');
        responseSubscriptionTwo.attributes.resource.type.should.equal('EMAIL');

        process.on('unhandledRejection', (error) => {
            should.fail(error.toString());
        });
    });

    it('Get all subscriptions without env filter should be successful and return a list of subscriptions with env=production (populated db)', async () => {
        mockGetUserFromToken(ROLES.USER);

        const subscriptionOne = await createSubscription(ROLES.USER.id, { env: 'production' });
        const subscriptionTwo = await createSubscription(ROLES.USER.id);
        await createSubscription(ROLES.USER.id, { env: 'staging' });

        await createSubscription(getUUID());

        const response = await requester
            .get(`/api/v1/subscriptions`)
            .set('Authorization', `Bearer abcd`)
            .send();

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(2);

        const responseSubscriptionOne = response.body.data[0];
        const responseSubscriptionTwo = response.body.data[1];

        responseSubscriptionOne.id.should.equal(subscriptionOne.id);
        responseSubscriptionOne.attributes.name.should.equal(subscriptionOne.name);
        responseSubscriptionOne.attributes.datasets.should.be.an('array').and.length(1).and.contains(subscriptionOne.datasets[0]);
        responseSubscriptionOne.attributes.datasetsQuery.should.be.an('array').and.length(0);
        responseSubscriptionOne.attributes.params.should.be.an('object').and.deep.equal({ geostore: 'agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw' });
        responseSubscriptionOne.attributes.userId.should.equal(subscriptionOne.userId);
        responseSubscriptionOne.attributes.confirmed.should.equal(subscriptionOne.confirmed);
        responseSubscriptionOne.attributes.resource.should.be.an('object');
        responseSubscriptionOne.attributes.resource.type.should.equal('EMAIL');

        responseSubscriptionTwo.id.should.equal(subscriptionTwo.id);
        responseSubscriptionTwo.attributes.name.should.equal(subscriptionTwo.name);
        responseSubscriptionTwo.attributes.datasets.should.be.an('array').and.length(1).and.contains(subscriptionTwo.datasets[0]);
        responseSubscriptionTwo.attributes.datasetsQuery.should.be.an('array').and.length(0);
        responseSubscriptionTwo.attributes.params.should.be.an('object').and.deep.equal({ geostore: 'agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw' });
        responseSubscriptionTwo.attributes.userId.should.equal(subscriptionTwo.userId);
        responseSubscriptionTwo.attributes.confirmed.should.equal(subscriptionTwo.confirmed);
        responseSubscriptionTwo.attributes.resource.should.be.an('object');
        responseSubscriptionTwo.attributes.resource.type.should.equal('EMAIL');

        process.on('unhandledRejection', (error) => {
            should.fail(error.toString());
        });
    });

    it('Get all subscriptions with env filter should be successful and return a list of subscriptions for that env (populated db)', async () => {
        mockGetUserFromToken(ROLES.USER);

        await createSubscription(ROLES.USER.id);
        await createSubscription(ROLES.USER.id);
        const subscriptionThree = await createSubscription(ROLES.USER.id, { env: 'staging' });

        await createSubscription(getUUID());

        const response = await requester
            .get(`/api/v1/subscriptions`)
            .set('Authorization', `Bearer abcd`)
            .query({ env: 'staging' })
            .send();

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(1);

        const responseSubscriptionOne = response.body.data[0];

        responseSubscriptionOne.id.should.equal(subscriptionThree.id);
        responseSubscriptionOne.attributes.name.should.equal(subscriptionThree.name);
        responseSubscriptionOne.attributes.datasets.should.be.an('array').and.length(1).and.contains(subscriptionThree.datasets[0]);
        responseSubscriptionOne.attributes.datasetsQuery.should.be.an('array').and.length(0);
        responseSubscriptionOne.attributes.params.should.be.an('object').and.deep.equal({ geostore: 'agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw' });
        responseSubscriptionOne.attributes.userId.should.equal(subscriptionThree.userId);
        responseSubscriptionOne.attributes.confirmed.should.equal(subscriptionThree.confirmed);
        responseSubscriptionOne.attributes.resource.should.be.an('object');
        responseSubscriptionOne.attributes.resource.type.should.equal('EMAIL');

        process.on('unhandledRejection', (error) => {
            should.fail(error.toString());
        });
    });

    it('Get all subscriptions without application filter should be successful and return a list of subscriptions with application=gfw (populated db)', async () => {
        mockGetUserFromToken(ROLES.USER);

        const subscriptionOne = await createSubscription(ROLES.USER.id, { application: 'gfw' });
        const subscriptionTwo = await createSubscription(ROLES.USER.id);
        await createSubscription(ROLES.USER.id, { application: 'rw' });

        await createSubscription(getUUID());

        const response = await requester
            .get(`/api/v1/subscriptions`)
            .set('Authorization', `Bearer abcd`)
            .send();

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(2);

        const responseSubscriptionOne = response.body.data[0];
        const responseSubscriptionTwo = response.body.data[1];

        responseSubscriptionOne.id.should.equal(subscriptionOne.id);
        responseSubscriptionOne.attributes.name.should.equal(subscriptionOne.name);
        responseSubscriptionOne.attributes.datasets.should.be.an('array').and.length(1).and.contains(subscriptionOne.datasets[0]);
        responseSubscriptionOne.attributes.datasetsQuery.should.be.an('array').and.length(0);
        responseSubscriptionOne.attributes.params.should.be.an('object').and.deep.equal({ geostore: 'agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw' });
        responseSubscriptionOne.attributes.userId.should.equal(subscriptionOne.userId);
        responseSubscriptionOne.attributes.confirmed.should.equal(subscriptionOne.confirmed);
        responseSubscriptionOne.attributes.resource.should.be.an('object');
        responseSubscriptionOne.attributes.resource.type.should.equal('EMAIL');

        responseSubscriptionTwo.id.should.equal(subscriptionTwo.id);
        responseSubscriptionTwo.attributes.name.should.equal(subscriptionTwo.name);
        responseSubscriptionTwo.attributes.datasets.should.be.an('array').and.length(1).and.contains(subscriptionTwo.datasets[0]);
        responseSubscriptionTwo.attributes.datasetsQuery.should.be.an('array').and.length(0);
        responseSubscriptionTwo.attributes.params.should.be.an('object').and.deep.equal({ geostore: 'agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw' });
        responseSubscriptionTwo.attributes.userId.should.equal(subscriptionTwo.userId);
        responseSubscriptionTwo.attributes.confirmed.should.equal(subscriptionTwo.confirmed);
        responseSubscriptionTwo.attributes.resource.should.be.an('object');
        responseSubscriptionTwo.attributes.resource.type.should.equal('EMAIL');

        process.on('unhandledRejection', (error) => {
            should.fail(error.toString());
        });
    });

    it('Get all subscriptions with application filter should be successful and return a list of subscriptions for that env (populated db)', async () => {
        mockGetUserFromToken(ROLES.USER);

        await createSubscription(ROLES.USER.id);
        await createSubscription(ROLES.USER.id);
        const subscriptionThree = await createSubscription(ROLES.USER.id, { application: 'rw' });

        await createSubscription(getUUID());

        const response = await requester
            .get(`/api/v1/subscriptions`)
            .set('Authorization', `Bearer abcd`)
            .query({ application: 'rw' })
            .send();

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(1);

        const responseSubscriptionOne = response.body.data[0];

        responseSubscriptionOne.id.should.equal(subscriptionThree.id);
        responseSubscriptionOne.attributes.name.should.equal(subscriptionThree.name);
        responseSubscriptionOne.attributes.datasets.should.be.an('array').and.length(1).and.contains(subscriptionThree.datasets[0]);
        responseSubscriptionOne.attributes.datasetsQuery.should.be.an('array').and.length(0);
        responseSubscriptionOne.attributes.params.should.be.an('object').and.deep.equal({ geostore: 'agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw' });
        responseSubscriptionOne.attributes.userId.should.equal(subscriptionThree.userId);
        responseSubscriptionOne.attributes.confirmed.should.equal(subscriptionThree.confirmed);
        responseSubscriptionOne.attributes.resource.should.be.an('object');
        responseSubscriptionOne.attributes.resource.type.should.equal('EMAIL');

        process.on('unhandledRejection', (error) => {
            should.fail(error.toString());
        });
    });

    it('Get all subscriptions with application and app filter should be successful and return a list of subscriptions for that env and application (no matches, populated db)', async () => {
        mockGetUserFromToken(ROLES.USER);

        await createSubscription(ROLES.USER.id, {
            application: 'rw',
            env: 'production'
        });
        await createSubscription(ROLES.USER.id, {
            application: 'gfw',
            env: 'production'
        });
        await createSubscription(ROLES.USER.id, { application: 'rw', env: 'staging' });

        await createSubscription(getUUID());

        const response = await requester
            .get(`/api/v1/subscriptions`)
            .set('Authorization', `Bearer abcd`)
            .query({ application: 'gfw', env: 'staging' })
            .send();

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(0);

        process.on('unhandledRejection', (error) => {
            should.fail(error.toString());
        });
    });

    it('Get all subscriptions with application and app filter should be successful and return a list of subscriptions for that env and application (populated db)', async () => {
        mockGetUserFromToken(ROLES.USER);

        await createSubscription(ROLES.USER.id, {
            application: 'rw',
            env: 'production'
        });
        const subscriptionTwo = await createSubscription(ROLES.USER.id, {
            application: 'gfw',
            env: 'production'
        });
        await createSubscription(ROLES.USER.id, { application: 'rw', env: 'staging' });

        await createSubscription(getUUID());

        const response = await requester
            .get(`/api/v1/subscriptions`)
            .set('Authorization', `Bearer abcd`)
            .query({ application: 'gfw', env: 'production' })
            .send();

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(1);

        const responseSubscriptionOne = response.body.data[0];

        responseSubscriptionOne.id.should.equal(subscriptionTwo.id);
        responseSubscriptionOne.attributes.name.should.equal(subscriptionTwo.name);
        responseSubscriptionOne.attributes.datasets.should.be.an('array').and.length(1).and.contains(subscriptionTwo.datasets[0]);
        responseSubscriptionOne.attributes.datasetsQuery.should.be.an('array').and.length(0);
        responseSubscriptionOne.attributes.params.should.be.an('object').and.deep.equal({ geostore: 'agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw' });
        responseSubscriptionOne.attributes.userId.should.equal(subscriptionTwo.userId);
        responseSubscriptionOne.attributes.confirmed.should.equal(subscriptionTwo.confirmed);
        responseSubscriptionOne.attributes.resource.should.be.an('object');
        responseSubscriptionOne.attributes.resource.type.should.equal('EMAIL');

        process.on('unhandledRejection', (error) => {
            should.fail(error.toString());
        });
    });

    afterEach(async () => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
    });
});
