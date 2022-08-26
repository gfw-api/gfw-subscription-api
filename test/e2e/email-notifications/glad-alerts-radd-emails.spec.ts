import chai from 'chai';
import nock from 'nock';
import config from 'config';
import { createClient, RedisClientType } from 'redis';

import Subscription from 'models/subscription';
import Statistic from 'models/statistic';
import AlertQueue from 'queues/alert.queue';

import { getTestServer } from '../utils/test-server';
import { createSubscriptionContent } from '../utils/helpers';
import { createMockGeostore } from '../utils/mock';
import { ROLES } from '../utils/test.constants';
import { mockGLADAllGeostoreQuery } from '../utils/mocks/gladAll.mocks';
import {
    mockGLADRADDAdm1Query,
    mockGLADRADDAdm2Query, mockGLADRADDGeostoreQuery,
    mockGLADRADDISOQuery,
    mockGLADRADDWDPAQuery
} from '../utils/mocks/gladRadd.mocks';

const {
    bootstrapEmailNotificationTests,
    validateCommonNotificationParams,
    validateCustomMapURLs,
    validateGladRadd,
} = require('../utils/helpers/email-notifications');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();
chai.use(require('chai-datetime'));

const CHANNEL: string = config.get('apiGateway.queueName');
let redisClient: RedisClientType;

describe('GLAD-RADD alerts', () => {

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

    it('GLAD-RADD alerts matches "glad-radd" for admin0 subscriptions, using the correct email template and providing the needed data', async () => {
        const sub = await new Subscription(createSubscriptionContent(
            ROLES.USER.id,
            'glad-radd',
            { params: { iso: { country: 'BRA' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        createMockGeostore('/v2/geostore/admin/BRA');

        mockGLADRADDISOQuery();

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'glad-updated-notification-en': {
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, sub);
                    validateCustomMapURLs(jsonMessage);
                    validateGladRadd(jsonMessage, sub, beginDate, endDate,
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

    it('GLAD-RADD alerts matches "glad-radd" for admin1 subscriptions, using the correct email template and providing the needed data', async () => {
        const sub = await new Subscription(createSubscriptionContent(
            ROLES.USER.id,
            'glad-radd',
            { params: { iso: { country: 'BRA', region: '1' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        createMockGeostore('/v2/geostore/admin/BRA/1');

        mockGLADRADDAdm1Query();

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'glad-updated-notification-en': {
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, sub);
                    validateCustomMapURLs(jsonMessage);
                    validateGladRadd(jsonMessage, sub, beginDate, endDate,
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

    it('GLAD-RADD alerts matches "glad-radd" for admin2 subscriptions, using the correct email template and providing the needed data', async () => {
        const sub = await new Subscription(createSubscriptionContent(
            ROLES.USER.id,
            'glad-radd',
            { params: { iso: { country: 'BRA', region: '1', subregion: '2' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        createMockGeostore('/v2/geostore/admin/BRA/1/2');

        mockGLADRADDAdm2Query();

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'glad-updated-notification-en': {
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, sub);
                    validateCustomMapURLs(jsonMessage);
                    validateGladRadd(jsonMessage, sub, beginDate, endDate,
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

    it('GLAD-RADD alerts matches "glad-radd" for WDPA subscriptions, using the correct email template and providing the needed data', async () => {
        const sub = await new Subscription(createSubscriptionContent(
            ROLES.USER.id,
            'glad-radd',
            { params: { wdpaid: '1' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        createMockGeostore('/v2/geostore/wdpa/1');

        mockGLADRADDWDPAQuery();

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'glad-updated-notification-en': {
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, sub);
                    validateCustomMapURLs(jsonMessage);
                    validateGladRadd(jsonMessage, sub, beginDate, endDate,
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

    it('GLAD-RADD alerts matches "glad-radd" for custom geostore subscriptions, using the correct email template and providing the needed data', async () => {
        const sub = await new Subscription(createSubscriptionContent(
            ROLES.USER.id,
            'glad-radd',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();

        mockGLADRADDGeostoreQuery();

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'glad-updated-notification-en': {
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, sub);
                    validateCustomMapURLs(jsonMessage);
                    validateGladRadd(jsonMessage, sub, beginDate, endDate,
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
        process.removeAllListeners('unhandledRejection');

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
        await Statistic.deleteMany({}).exec();
    });
});
