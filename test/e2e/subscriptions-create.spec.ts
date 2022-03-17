import nock from 'nock';
import chai from 'chai';
import Subscription from 'models/subscription';
import config from 'config';
import { createClient, RedisClientType } from 'redis';
import { sleep } from 'sleep';
import { ROLES } from './utils/test.constants';
import { getTestServer } from './utils/test-server';
import { mockGetUserFromToken, validRedisMessage } from './utils/helpers';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();

const CHANNEL: string = config.get('apiGateway.queueName');
let redisClient: RedisClientType;

let requester: ChaiHttp.Agent;

const assertSubscriptionResponse = async (response: Record<string, any>) => {
    response.status.should.equal(200);
    response.body.should.have.property('data').and.be.an('object');

    const databaseSubscriptions = await Subscription.find({}).exec();
    databaseSubscriptions.should.be.an('array').and.have.length(1);

    const subscriptionOne = databaseSubscriptions[0];
    const responseSubscription = response.body.data;

    responseSubscription.id.should.equal(subscriptionOne.id);
    responseSubscription.attributes.should.have.property('confirmed').and.equal(subscriptionOne.confirmed);
    responseSubscription.attributes.should.have.property('datasets').and.be.an('array').and.length(1).and.contains(subscriptionOne.datasets[0]);
    responseSubscription.attributes.should.have.property('createdAt').and.be.a('string');
    responseSubscription.attributes.should.have.property('datasetsQuery').and.be.an('array').and.length(0);
    responseSubscription.attributes.should.have.property('env').and.equal(subscriptionOne.env);
    responseSubscription.attributes.should.have.property('language').and.equal(subscriptionOne.language);
    responseSubscription.attributes.should.have.property('params').and.deep.equal(subscriptionOne.params);
    responseSubscription.attributes.resource.should.have.property('content').and.equal(subscriptionOne.resource.content);
    responseSubscription.attributes.resource.should.have.property('type').and.equal(subscriptionOne.resource.type);

    process.on('unhandledRejection', (err) => should.fail(err.toString()));
};

describe('Create subscription', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        redisClient = createClient({ url: config.get('redis.url') });
        await redisClient.connect();

        requester = await getTestServer();

        await Subscription.deleteMany({}).exec();
    });

    it('Create a subscription with no dataset or datasetsQuery should return a 400 error', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        await redisClient.subscribe(CHANNEL, () => should.fail('should not be called'));

        const response = await requester
            .post(`/api/v1/subscriptions`)
            .set('Authorization', `Bearer abcd`)
            .send({});

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array').and.length(1);
        response.body.errors[0].should.have.property('status').and.equal(400);
        response.body.errors[0].should.have.property('detail').and.equal('Datasets or datasetsQuery required');

        sleep(1);
    });

    it('Create a subscription with no language should return a 400 error', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        await redisClient.subscribe(CHANNEL, () => should.fail('should not be called'));

        const response = await requester
            .post(`/api/v1/subscriptions`)
            .set('Authorization', `Bearer abcd`)
            .send({
                datasets: ['123456789'],
            });

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array').and.length(1);
        response.body.errors[0].should.have.property('status').and.equal(400);
        response.body.errors[0].should.have.property('detail').and.equal('Language required');

        sleep(1);
    });

    it('Create a subscription with no resource should return a 400 error', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        await redisClient.subscribe(CHANNEL, () => should.fail('should not be called'));

        const response = await requester
            .post(`/api/v1/subscriptions`)
            .set('Authorization', `Bearer abcd`)
            .send({
                datasets: ['123456789'],
                language: 'en',
            });

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array').and.length(1);
        response.body.errors[0].should.have.property('status').and.equal(400);
        response.body.errors[0].should.have.property('detail').and.equal('Resource required');

        sleep(1);
    });

    it('Create a subscription with no params should return a 400 error', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        await redisClient.subscribe(CHANNEL, () => should.fail('should not be called'));

        const response = await requester
            .post(`/api/v1/subscriptions`)
            .set('Authorization', `Bearer abcd`)
            .send({
                datasets: ['123456789'],
                language: 'en',
                resource: {
                    type: 'EMAIL',
                    content: 'email@address.com'
                },
            });

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array').and.length(1);
        response.body.errors[0].should.have.property('status').and.equal(400);
        response.body.errors[0].should.have.property('detail').and.equal('Params required');

        sleep(1);
    });

    it('Create a subscription with the basic required fields should return a 200, create a subscription and emit a redis message (happy case)', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        await redisClient.subscribe(CHANNEL, validRedisMessage({
            template: 'subscription-confirmation-en',
            application: 'gfw',
        }));

        const response = await requester
            .post(`/api/v1/subscriptions`)
            .set('Authorization', `Bearer abcd`)
            .send({
                datasets: ['123456789'],
                language: 'en',
                resource: {
                    type: 'EMAIL',
                    content: 'email@address.com'
                },
                params: {
                    geostore: '35a6d982388ee5c4e141c2bceac3fb72'
                },
            });

        await assertSubscriptionResponse(response);
    });

    it('Create a subscription with the basic required fields with application = "test" should return a 200, create a subscription and emit a redis message (happy case)', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        await redisClient.subscribe(CHANNEL, validRedisMessage({
            template: 'subscription-confirmation-test-en',
            application: 'gfw',
        }));

        const response = await requester
            .post(`/api/v1/subscriptions`)
            .set('Authorization', `Bearer abcd`)
            .send({
                datasets: ['123456789'],
                language: 'en',
                resource: {
                    type: 'EMAIL',
                    content: 'email@address.com'
                },
                application: 'test',
                params: {
                    geostore: '35a6d982388ee5c4e141c2bceac3fb72'
                },
            });

        await assertSubscriptionResponse(response);
    });

    it('Create a subscription with the basic required fields with resource_type = "URL" should return a 200, create a subscription, and don\'t emit a redis message (happy case)', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        await redisClient.subscribe(CHANNEL, () => should.fail('should not be called'));

        const response = await requester
            .post(`/api/v1/subscriptions`)
            .set('Authorization', `Bearer abcd`)
            .send({
                datasets: ['123456789'],
                language: 'ru',
                resource: {
                    type: 'URL',
                    content: 'http://www.google.com',
                },
                application: 'test',
                params: {
                    geostore: '35a6d982388ee5c4e141c2bceac3fb72'
                },
            });

        await assertSubscriptionResponse(response);
        sleep(1);
    });

    it('Create a subscription with an invalid language should sanitize the language, return a 200, create a subscription and emit a redis message (happy case)', async () => {
        mockGetUserFromToken(ROLES.ADMIN);

        await redisClient.subscribe(CHANNEL, validRedisMessage({
            template: 'subscription-confirmation-en',
            application: 'gfw',
        }));

        const response = await requester
            .post(`/api/v1/subscriptions`)
            .set('Authorization', `Bearer abcd`)
            .send({
                datasets: ['123456789'],
                language: 'ru',
                resource: {
                    type: 'EMAIL',
                    content: 'email@address.com'
                },
                params: {
                    geostore: '35a6d982388ee5c4e141c2bceac3fb72'
                },
            });

        await assertSubscriptionResponse(response);
        // Ensure language has been sanitized
        response.body.data.attributes.should.have.property('language').and.equal('en');
    });

    afterEach(async () => {
        process.removeAllListeners('unhandledRejection');
        await redisClient.unsubscribe(CHANNEL);

        await Subscription.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
