import chai from 'chai';
import nock from 'nock';
import config from 'config';
import moment from 'moment';
import { createClient, RedisClientType } from 'redis';

import Subscription from  'models/subscription';
import Statistic from  'models/statistic';
import AlertQueue from  'queues/alert.queue';

import { getTestServer } from  '../utils/test-server';
import { createURLSubscription, createURLSubscriptionCallMock } from  '../utils/helpers';
import { USERS } from  '../utils/test.constants';

import {
    assertSubscriptionStatsNotificationEvent,
    bootstrapEmailNotificationTests,
} from  '../utils/helpers/email-notifications';

import {
    createGLADAlertsGeostoreURLSubscriptionBody,createGLADAlertsISOURLSubscriptionBody,
    createGLADAlertsWDPAURLSubscriptionBody,
} from  '../utils/mocks/glad.mocks';
import {
    mockGLADLAdm1Query,
    mockGLADLAdm2Query,
    mockGLADLGeostoreQuery,
    mockGLADLISOQuery, mockGLADLWDPAQuery
} from '../utils/mocks/gladL.mocks';
import { createMockGeostore } from '../utils/mock';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();
chai.use(require('chai-datetime'));

const CHANNEL: string = config.get('apiGateway.queueName');
let redisClient: RedisClientType;

describe('GLAD alert - URL Subscriptions', () => {

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

        redisClient = createClient({ url: config.get('redis.url') });
        await redisClient.connect();
    });

    it('Updating GLAD alerts dataset triggers the configured subscription url being called using the correct body data', async () => {
        const subscriptionOne = await new Subscription(createURLSubscription(
            USERS.USER.id,
            'glad-alerts',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADLGeostoreQuery();

        createURLSubscriptionCallMock(createGLADAlertsGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'subscriptions-stats':
                    assertSubscriptionStatsNotificationEvent(jsonMessage);
                    break;
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

    it('Updating GLAD alerts dataset triggers the configured subscription url being called using the correct body data taking into account different languages', async () => {
        moment.locale('fr');
        const subscriptionOne = await new Subscription(createURLSubscription(
            USERS.USER.id,
            'glad-alerts',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' }, language: 'fr' },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADLGeostoreQuery();

        createURLSubscriptionCallMock(createGLADAlertsGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
            glad_alert_type: 'alertes de déforestation (GLAD-L)'
        }));

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'subscriptions-stats':
                    assertSubscriptionStatsNotificationEvent(jsonMessage);
                    break;
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

    it('Updating GLAD alerts dataset triggers the configured subscription url being called using the correct body data - ISO code for country', async () => {
        const subscriptionOne = await new Subscription(createURLSubscription(
            USERS.USER.id,
            'glad-alerts',
            { params: { iso: { country: 'BRA' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADLISOQuery();
        createMockGeostore('/v2/geostore/admin/BRA');

        createURLSubscriptionCallMock(createGLADAlertsISOURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
            selected_area: 'ISO Code: BRA',
        }));

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'subscriptions-stats':
                    assertSubscriptionStatsNotificationEvent(jsonMessage);
                    break;
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

    it('Updating GLAD alerts dataset triggers the configured subscription url being called using the correct body data - ISO code for country and region', async () => {
        const subscriptionOne = await new Subscription(createURLSubscription(
            USERS.USER.id,
            'glad-alerts',
            { params: { iso: { country: 'BRA', region: '1' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADLAdm1Query();
        createMockGeostore('/v2/geostore/admin/BRA/1');

        createURLSubscriptionCallMock(createGLADAlertsISOURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
            selected_area: 'ISO Code: BRA, ID1: 1',
        }));

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'subscriptions-stats':
                    assertSubscriptionStatsNotificationEvent(jsonMessage);
                    break;
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

    it('Updating GLAD alerts dataset triggers the configured subscription url being called using the correct body data - ISO code for country, region and subregion', async () => {
        const subscriptionOne = await new Subscription(createURLSubscription(
            USERS.USER.id,
            'glad-alerts',
            { params: { iso: { country: 'BRA', region: '1', subregion: '2' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADLAdm2Query();
        createMockGeostore('/v2/geostore/admin/BRA/1/2');

        createURLSubscriptionCallMock(createGLADAlertsISOURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
            selected_area: 'ISO Code: BRA, ID1: 1, ID2: 2',
        }));

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'subscriptions-stats':
                    assertSubscriptionStatsNotificationEvent(jsonMessage);
                    break;
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

    it('Updating GLAD alerts dataset triggers the configured subscription url being called using the correct body data - WDPA ID', async () => {
        const subscriptionOne = await new Subscription(createURLSubscription(
            USERS.USER.id,
            'glad-alerts',
            { params: { wdpaid: '1' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADLWDPAQuery();
        createMockGeostore('/v2/geostore/wdpa/1');

        createURLSubscriptionCallMock(createGLADAlertsWDPAURLSubscriptionBody(subscriptionOne, beginDate, endDate));

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'subscriptions-stats':
                    assertSubscriptionStatsNotificationEvent(jsonMessage);
                    break;
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

    it('Updating GLAD alerts dataset triggers the configured subscription url being called using the correct body data - USE ID', async () => {
        const subscriptionOne = await new Subscription(createURLSubscription(
            USERS.USER.id,
            'glad-alerts',
            { params: { use: 'gfw_logging', useid: '29407' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADLGeostoreQuery();
        createMockGeostore('/v2/geostore/use/gfw_logging/29407', 2);

        createURLSubscriptionCallMock(createGLADAlertsGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
            downloadUrls: {
                csv: `${config.get('dataApi.url')}/dataset/umd_glad_landsat_alerts/latest/download/csv?sql=SELECT latitude, longitude, umd_glad_landsat_alerts__date, umd_glad_landsat_alerts__confidence FROM data WHERE umd_glad_landsat_alerts__date >= '${beginDate.format('YYYY-MM-DD')}' AND umd_glad_landsat_alerts__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_origin=rw&geostore_id=423e5dfb0448e692f97b590c61f45f22`,
                json: `${config.get('dataApi.url')}/dataset/umd_glad_landsat_alerts/latest/download/json?sql=SELECT latitude, longitude, umd_glad_landsat_alerts__date, umd_glad_landsat_alerts__confidence FROM data WHERE umd_glad_landsat_alerts__date >= '${beginDate.format('YYYY-MM-DD')}' AND umd_glad_landsat_alerts__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_origin=rw&geostore_id=423e5dfb0448e692f97b590c61f45f22`
            },
        }));

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'subscriptions-stats':
                    assertSubscriptionStatsNotificationEvent(jsonMessage);
                    break;
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

    it('Updating GLAD alerts dataset does not trigger the configured subscription url being called if no alerts are returned by the query', async () => {
        await new Subscription(createURLSubscription(
            USERS.USER.id,
            'glad-alerts',
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADLGeostoreQuery(1, { data: [] }, 200);

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'subscriptions-stats':
                    jsonMessage.should.have.property('sender').and.equal('gfw');
                    jsonMessage.should.have.property('data').and.be.a('object');
                    jsonMessage.data.should.have.property('counter').and.equal(0);
                    jsonMessage.data.should.have.property('dataset').and.equal('glad-alerts');
                    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
                    jsonMessage.recipients[0].should.be.an('object').and.have.property('address')
                        .and.have.property('email').and.equal(config.get('mails.statsRecipients'));
                    break;
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

    it('Updating GLAD alerts dataset triggers the configured subscription url being called using the correct body data - Legacy params', async () => {
        const subscriptionOne = await new Subscription(createURLSubscription(
            USERS.USER.id,
            'glad-alerts',
            {
                params: {
                    iso: {
                        subRegion: null,
                        region: null,
                        country: null
                    },
                    wdpaid: null,
                    use: null,
                    useid: null,
                    geostore: '423e5dfb0448e692f97b590c61f45f22'
                }
            },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADLGeostoreQuery();

        createURLSubscriptionCallMock(createGLADAlertsGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'subscriptions-stats':
                    assertSubscriptionStatsNotificationEvent(jsonMessage);
                    break;
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
        moment.locale('en');
        redisClient.removeAllListeners();
        process.removeAllListeners('unhandledRejection');

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
        await Statistic.deleteMany({}).exec();
    });
});
