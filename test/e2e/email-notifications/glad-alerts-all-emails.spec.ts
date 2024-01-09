import chai from 'chai';
import nock from 'nock';
import config from 'config';
import { createClient, RedisClientType } from 'redis';

import Subscription, { ISubscription } from 'models/subscription';
import Statistic from 'models/statistic';
import AlertQueue from 'queues/alert.queue';

import { createSubscription, createSubscriptionContent } from '../utils/helpers';
import { createMockGeostore } from '../utils/mock';
import { USERS } from '../utils/test.constants';
import { getTestServer } from '../utils/test-server';
import {
    mockGLADAllAdm1Query,
    mockGLADAllAdm2Query,
    mockGLADAllGeostoreQuery,
    mockGLADAllISOQuery, mockGLADAllWDPAQuery
} from '../utils/mocks/gladAll.mocks';

const {
    bootstrapEmailNotificationTests,
    validateCommonNotificationParams,
    validateCustomMapURLs, validateGladAll,
} = require('../utils/helpers/email-notifications');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();
chai.use(require('chai-datetime'));

const CHANNEL: string = config.get('apiGateway.queueName');
let redisClient: RedisClientType;

describe('GLAD-ALL alerts', () => {

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

    it('GLAD-ALL alerts matches "glad-all" for admin0 subscriptions, using the correct email template and providing the needed data', async () => {
        const sub: ISubscription = await createSubscription(
            USERS.USER.id,
            { datasets: ['glad-all'], params: { iso: { country: 'BRA' } } }
        );

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        createMockGeostore('/v2/geostore/admin/BRA');

        mockGLADAllISOQuery();

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'glad-updated-notification-en': {
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, sub);
                    validateCustomMapURLs(jsonMessage);
                    validateGladAll(jsonMessage, sub, beginDate, endDate,
                        {
                            total: 400,
                            area: '40',
                            intactForestArea: '10',
                            primaryForestArea: '10',
                            peatArea: '10',
                            wdpaArea: '10'
                        });
                    break;
                }
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }
        });

        await AlertQueue.processMessage(JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('GLAD-ALL alerts matches "glad-all" for admin1 subscriptions, using the correct email template and providing the needed data', async () => {
        const sub = await new Subscription(createSubscriptionContent(
            USERS.USER.id,
            'glad-all',
            { params: { iso: { country: 'BRA', region: '1' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        createMockGeostore('/v2/geostore/admin/BRA/1');

        mockGLADAllAdm1Query();

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'glad-updated-notification-en': {
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, sub);
                    validateCustomMapURLs(jsonMessage);
                    validateGladAll(jsonMessage, sub, beginDate, endDate,
                        {
                            total: 400,
                            area: '40',
                            intactForestArea: '10',
                            primaryForestArea: '10',
                            peatArea: '10',
                            wdpaArea: '10'
                        });
                    break;
                }
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }
        });

        await AlertQueue.processMessage(JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('GLAD-ALL alerts matches "glad-all" for admin2 subscriptions, using the correct email template and providing the needed data', async () => {
        const sub = await new Subscription(createSubscriptionContent(
            USERS.USER.id,
            'glad-all',
            { params: { iso: { country: 'BRA', region: '1', subregion: '2' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        createMockGeostore('/v2/geostore/admin/BRA/1/2');

        mockGLADAllAdm2Query();

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'glad-updated-notification-en': {
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, sub);
                    validateCustomMapURLs(jsonMessage);
                    validateGladAll(jsonMessage, sub, beginDate, endDate,
                        {
                            total: 400,
                            area: '40',
                            intactForestArea: '10',
                            primaryForestArea: '10',
                            peatArea: '10',
                            wdpaArea: '10'
                        });
                    break;
                }
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }
        });

        await AlertQueue.processMessage(JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('GLAD-ALL alerts matches "glad-all" for WDPA subscriptions, using the correct email template and providing the needed data', async () => {
        const sub = await new Subscription(createSubscriptionContent(
            USERS.USER.id,
            'glad-all',
            { params: { wdpaid: '1' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        createMockGeostore('/v2/geostore/wdpa/1');

        mockGLADAllWDPAQuery()

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'glad-updated-notification-en': {
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, sub);
                    validateCustomMapURLs(jsonMessage);
                    validateGladAll(jsonMessage, sub, beginDate, endDate,
                        {
                            total: 400,
                            area: '40',
                            intactForestArea: '10',
                            primaryForestArea: '10',
                            peatArea: '10',
                            wdpaArea: '10'
                        });
                    break;
                }
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }
        });

        await AlertQueue.processMessage(JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('GLAD-ALL alerts matches "glad-all" for custom geostore subscriptions, using the correct email template and providing the needed data', async () => {
        const sub = await new Subscription(createSubscriptionContent(
            USERS.USER.id,
            'glad-all',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();

        mockGLADAllGeostoreQuery()

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'glad-updated-notification-en': {
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, sub);
                    validateCustomMapURLs(jsonMessage);
                    validateGladAll(jsonMessage, sub, beginDate, endDate,
                        {
                            total: 400,
                            area: '40',
                            intactForestArea: '10',
                            primaryForestArea: '10',
                            peatArea: '10',
                            wdpaArea: '10'
                        });
                    break;
                }
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }
        });

        await AlertQueue.processMessage(JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    afterEach(async () => {
        await redisClient.unsubscribe(CHANNEL);
        ;
        process.removeAllListeners('unhandledRejection');

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
        await Statistic.deleteMany({}).exec();
    });
});
