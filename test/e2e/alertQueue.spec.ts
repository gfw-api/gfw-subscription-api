import chai from 'chai';
import nock from 'nock';
import config from 'config';
import moment from 'moment';
import Subscription from 'models/subscription';
import Statistic from 'models/statistic';
import { getTestServer } from './utils/test-server';
import { createDatasetWithWebHook } from './utils/helpers';
import AlertQueue from 'queues/alert.queue';
import { mockGLADLGeostoreQuery } from './utils/mocks/gladL.mocks';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();
chai.use(require('chai-datetime'));

const assertMessageProcessing = async () => {
    process.on('unhandledRejection', (args: any) => {
        should.fail(...args);
    });

    const beginDate = moment().subtract('2', 'w').toDate();
    const endDate = moment().subtract('1', 'w').toDate();
    await AlertQueue.processMessage(JSON.stringify({
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
        mockGLADLGeostoreQuery();
        await assertMessageProcessing();
    });

    it('All goes well when a dataset Redis message is received for a subscription with a valid resource type URL that returns 4XX codes', async () => {
        await createDatasetWithWebHook('http://www.webhook.com');

        mockGLADLGeostoreQuery();

        // If this mock is not used (i.e., the web-hook is not called), the test will fail
        nock('http://www.webhook.com').post('/').query(() => true).reply(400);

        await assertMessageProcessing();
    });

    it('POST request to a web-hook URL triggered when a dataset Redis message is received for a subscription with a valid resource type URL (happy case)', async () => {
        await createDatasetWithWebHook('http://www.webhook.com');

        mockGLADLGeostoreQuery();

        // If this mock is not used (i.e., the web-hook is not called), the test will fail
        nock('http://www.webhook.com').post('/').query(() => true).reply(200, { received: true });

        await assertMessageProcessing();
    });

    afterEach(async () => {
        process.removeAllListeners('unhandledRejection');

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
        await Statistic.deleteMany({}).exec();
    });
});
