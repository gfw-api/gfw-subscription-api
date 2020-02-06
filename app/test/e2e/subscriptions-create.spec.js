/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const chai = require('chai');
const Subscription = require('models/subscription');
const config = require('config');
const redis = require('redis');
const { sleep } = require('sleep');
const { ROLES } = require('./utils/test.constants');
const { getTestServer } = require('./utils/test-server');
const { validRedisMessage } = require('./utils/helpers');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();

const CHANNEL = config.get('apiGateway.queueName');

let requester;

describe('Create subscriptions tests', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        this.channel = redis.createClient({ url: config.get('redis.url') });
        this.channel.subscribe(CHANNEL);

        requester = await getTestServer();

        await Subscription.deleteMany({}).exec();
    });

    it('Create a subscription with no dataset or datasetsQuery should return a 400 error', async () => {
        this.channel.on('message', () => should.fail('should not be called'));

        const response = await requester
            .post(`/api/v1/subscriptions`)
            .send({
                loggedUser: ROLES.ADMIN
            });

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array').and.length(1);
        response.body.errors[0].should.have.property('status').and.equal(400);
        response.body.errors[0].should.have.property('detail').and.equal('Datasets or datasetsQuery required');

        sleep(1);
    });

    it('Create a subscription with no language should return a 400 error', async () => {
        this.channel.on('message', () => should.fail('should not be called'));

        const response = await requester
            .post(`/api/v1/subscriptions`)
            .send({
                datasets: ['123456789'],
                loggedUser: ROLES.ADMIN
            });

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array').and.length(1);
        response.body.errors[0].should.have.property('status').and.equal(400);
        response.body.errors[0].should.have.property('detail').and.equal('Language required');

        sleep(1);
    });

    it('Create a subscription with no resource should return a 400 error', async () => {
        this.channel.on('message', () => should.fail('should not be called'));

        const response = await requester
            .post(`/api/v1/subscriptions`)
            .send({
                datasets: ['123456789'],
                language: 'en',
                loggedUser: ROLES.ADMIN
            });

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array').and.length(1);
        response.body.errors[0].should.have.property('status').and.equal(400);
        response.body.errors[0].should.have.property('detail').and.equal('Resource required');

        sleep(1);
    });

    it('Create a subscription with no params should return a 400 error', async () => {
        this.channel.on('message', () => should.fail('should not be called'));

        const response = await requester
            .post(`/api/v1/subscriptions`)
            .send({
                datasets: ['123456789'],
                language: 'en',
                resource: {
                    type: 'EMAIL',
                    content: 'email@address.com'
                },
                loggedUser: ROLES.ADMIN
            });

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array').and.length(1);
        response.body.errors[0].should.have.property('status').and.equal(400);
        response.body.errors[0].should.have.property('detail').and.equal('Params required');

        sleep(1);
    });

    it('Create a subscription with the basic required fields should return a 200, create a subscription and emit a redis message (happy Case)', async () => {
        this.channel.on('message', validRedisMessage({
            template: 'subscription-confirmation-en',
            application: 'gfw',
            language: 'en',
        }));

        const response = await requester
            .post(`/api/v1/subscriptions`)
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
                loggedUser: ROLES.ADMIN
            });

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

        process.on('unhandledRejection', (err) => should.fail(err));
    });

    it('Create a subscription with the basic required fields with language = "RU" should return a 200, create a subscription and emit a redis message (happy case)', async () => {
        this.channel.on('message', validRedisMessage({
            template: 'subscription-confirmation-ru',
            application: 'gfw',
            language: 'ru',
        }));

        const response = await requester
            .post(`/api/v1/subscriptions`)
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
                loggedUser: ROLES.ADMIN
            });

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

        process.on('unhandledRejection', (err) => should.fail(err));
    });

    it('Create a subscription with the basic required fields with application = "test" should return a 200, create a subscription and emit a redis message(happy case)', async () => {
        this.channel.on('message', validRedisMessage({
            template: 'subscription-confirmation-test-ru',
            application: 'gfw',
            language: 'ru',
        }));

        const response = await requester
            .post(`/api/v1/subscriptions`)
            .send({
                datasets: ['123456789'],
                language: 'ru',
                resource: {
                    type: 'EMAIL',
                    content: 'email@address.com'
                },
                application: 'test',
                params: {
                    geostore: '35a6d982388ee5c4e141c2bceac3fb72'
                },
                loggedUser: ROLES.ADMIN
            });

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

        process.on('unhandledRejection', (err) => should.fail(err));
    });

    it('Create a subscription with the basic required fields with resource_type = "URL" should return a 200, create a subscription, and don\'t emit a redis message (happy case)', async () => {
        this.channel.on('message', () => should.fail('should not be called'));

        const response = await requester
            .post(`/api/v1/subscriptions`)
            .send({
                datasets: ['123456789'],
                language: 'ru',
                resource: {
                    type: 'URL',
                },
                application: 'test',
                params: {
                    geostore: '35a6d982388ee5c4e141c2bceac3fb72'
                },
                loggedUser: ROLES.ADMIN
            });

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
        responseSubscription.attributes.resource.should.have.property('type').and.equal(subscriptionOne.resource.type);

        sleep(1);
    });

    afterEach(async () => {
        process.removeAllListeners('unhandledRejection');
        this.channel.removeAllListeners('message');

        await Subscription.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
