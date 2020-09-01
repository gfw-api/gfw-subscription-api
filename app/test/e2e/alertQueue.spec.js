const chai = require('chai');
const nock = require('nock');
const config = require('config');
const moment = require('moment');
const Subscription = require('models/subscription');
const Statistic = require('models/statistic');
const redis = require('redis');
const { getTestServer } = require('./utils/test-server');

const { createDatasetWithWebHook } = require('./utils/helpers');
const { mockGLADAlertsQuery } = require('./utils/mock');

const AlertQueue = require('../../src/queues/alert.queue');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();
chai.use(require('chai-datetime'));

const CHANNEL = config.get('apiGateway.queueName');
const redisClient = redis.createClient({ url: config.get('redis.url') });
redisClient.subscribe(CHANNEL);

const assertMessageProcessing = async () => {
    process.on('unhandledRejection', (args) => { should.fail(...args); });

    const beginDate = moment().subtract('2', 'w').toDate();
    const endDate = moment().subtract('1', 'w').toDate();
    await AlertQueue.processMessage(null, JSON.stringify({
        layer_slug: 'glad-alerts',
        begin_date: beginDate,
        end_date: endDate,
    }));
};

describe('AlertQueue ', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }
        if (config.get('settings.loadCron') && config.get('settings.loadCron') !== 'false') {
            throw Error(`Running the test suite with cron enabled is not supported. You can disable cron by setting the LOAD_CRON env variable to false.`);
        }

        await getTestServer();

        await Subscription.deleteMany({}).exec();
        await Statistic.deleteMany({}).exec();
    });

    it('All goes well when a dataset Redis message is received for a subscription with an invalid resource type URL', async () => {
        await createDatasetWithWebHook('invalidURL');
        await assertMessageProcessing();
    });

    it('All goes well when a dataset Redis message is received for a subscription with a valid resource type URL that returns 4XX codes', async () => {
        await createDatasetWithWebHook('http://www.webhook.com');
        mockGLADAlertsQuery(3);

        // If this mock is not used (i.e., the web-hook is not called), the test will fail
        nock('http://www.webhook.com').post('/').query(() => true).reply(400);

        await assertMessageProcessing();
    });

    it('POST request to a web-hook URL triggered when a dataset Redis message is received for a subscription with a valid resource type URL (happy case)', async () => {
        await createDatasetWithWebHook('http://www.webhook.com');
        mockGLADAlertsQuery(3);

        // If this mock is not used (i.e., the web-hook is not called), the test will fail
        nock('http://www.webhook.com').post('/').query(() => true).reply(200, { received: true });

        await assertMessageProcessing();
    });

    afterEach(async () => {
        redisClient.removeAllListeners('message');
        process.removeAllListeners('unhandledRejection');

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
        await Statistic.deleteMany({}).exec();
    });
});
