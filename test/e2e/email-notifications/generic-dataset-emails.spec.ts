import chai from 'chai';
import nock from 'nock';
import config from 'config';
import { createClient, RedisClientType } from 'redis';

import Subscription, { ISubscription } from 'models/subscription';
import Statistic from 'models/statistic';
import AlertQueue from 'queues/alert.queue';

import { getTestServer } from '../utils/test-server';
import { createSubscription, getUUID } from '../utils/helpers';
import { ROLES } from '../utils/test.constants';
import {
    createMockDataset,
    createMockDatasetQuery,
    createMockGetDatasetMetadata
} from '../utils/mock';

const {
    bootstrapEmailNotificationTests,
} = require('../utils/helpers/email-notifications');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();
chai.use(require('chai-datetime'));

const CHANNEL: string = config.get('apiGateway.queueName');
let redisClient: RedisClientType;


describe('Generic dataset emails', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        if (config.get('settings.loadCron') && config.get('settings.loadCron') !== 'false') {
            throw Error(`Running the test suite with cron enabled is not supported. You can disable cron by setting the LOAD_CRON env variable to false.`);
        }

        await getTestServer();

        redisClient = createClient({ url: config.get('redis.url') });
        await redisClient.connect();
    });

    it('Processing a dataset subscription without datasetQuery should not queue an email', async () => {
        await createSubscription(
            ROLES.USER.id,
            {
                datasetUuid: 'dataset',
                params: { geostore: '423e5dfb0448e692f97b590c61f45f22' }
            },
        );

        const { beginDate, endDate } = bootstrapEmailNotificationTests();

        await AlertQueue.processMessage(JSON.stringify({
            layer_slug: 'dataset',
            begin_date: beginDate,
            end_date: endDate
        }));


        const validateQueuedMessage = () => {
            should.fail('Unexpected message');
        };

        redisClient.subscribe(CHANNEL, validateQueuedMessage);
    });

    it('Processing a dataset subscription with datasetQuery should queue an email (happy case)', async () => {
        const datasetId = getUUID();
        const query: string = 'SELECT * from dataset WHERE somedate > {{begin}}';
        const realizedQuery: string = query.replace('{{begin}}', (new Date()).toISOString().slice(0, 10));

        const subscription: ISubscription = await createSubscription(
            ROLES.USER.id,
            {
                datasetUuid: 'dataset',
                params: { geostore: '423e5dfb0448e692f97b590c61f45f22' },
                datasetsQuery: [{
                    id: datasetId,
                    type: 'dataset',
                    lastSentDate: Date.now(),
                    threshold: 1,
                    historical: []
                }],
            }
        );

        createMockDataset(datasetId, {
            subscribable: {
                dataset: {
                    dataQuery: '{{begin}}',
                    subscriptionQuery: query
                }
            },
        });
        createMockDatasetQuery({
            sql: realizedQuery,
            threshold: 1,
            geostore: '423e5dfb0448e692f97b590c61f45f22'
        }, {
            data: [{
                value: 2
            }]
        });
        createMockGetDatasetMetadata(datasetId, 'gfw', 'en', { data: [{ attributes: { info: { name: 'dataset' } } }] });

        const { beginDate, endDate } = bootstrapEmailNotificationTests();

        let expectedQueueMessageCount = 1;

        const validateMailQueuedMessages = (resolve: (value: (PromiseLike<unknown> | unknown)) => void) => async (message: string) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'dataset-rw': {
                    jsonMessage.data.should.deep.equal({
                        subject: subscription.name,
                        datasetName: "dataset",
                        areaId: "",
                        areaName: "",
                        alertName: subscription.name,
                        alertType: "dataset",
                        alertBeginDate: (new Date()).toISOString().slice(0, 10),
                        alertEndDate: (new Date()).toISOString().slice(0, 10),
                        alertResult: 2
                    })
                    jsonMessage.recipients.should.deep.equal([{ address: 'subscription-recipient@vizzuality.com' }]);
                    jsonMessage.sender.should.equal('rw')
                    break;
                }
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }

            expectedQueueMessageCount -= 1;

            if (expectedQueueMessageCount < 0) {
                throw new Error(`Unexpected message count - expectedQueueMessageCount:${expectedQueueMessageCount}`);
            }

            if (expectedQueueMessageCount === 0) {
                resolve(null);
            }
        };

        const consumerPromise = new Promise((resolve) => {
            redisClient.subscribe(CHANNEL, validateMailQueuedMessages(resolve));
        })

        AlertQueue.processMessage(JSON.stringify({
            layer_slug: 'dataset',
            begin_date: beginDate,
            end_date: endDate
        }));

        return consumerPromise;
    });

    afterEach(async () => {
        await redisClient.unsubscribe(CHANNEL);
        process.removeAllListeners('unhandledRejection');

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
        await Statistic.deleteMany({}).exec();
    });
});
