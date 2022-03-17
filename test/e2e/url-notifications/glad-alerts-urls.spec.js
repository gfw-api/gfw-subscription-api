const chai = require('chai');
const nock = require('nock');
const config = require('config');
const moment = require('moment');
const redis = require('redis');

const Subscription = require('models/subscription');
const Statistic = require('models/statistic');
const AlertQueue = require('queues/alert.queue');

const { getTestServer } = require('../utils/test-server');
const { createURLSubscription, createURLSubscriptionCallMock } = require('../utils/helpers');
const {
    createMockGeostore,
    mockGLADAlertsGeostoreQuery,
    mockGLADAlertsISOQuery, mockGLADAlertsWDPAQuery
} = require('../utils/mock');
const { ROLES } = require('../utils/test.constants');

const {
    assertSubscriptionStatsNotificationEvent,
    bootstrapEmailNotificationTests,
} = require('../utils/helpers/email-notifications');

const {
    createGLADAlertsGeostoreURLSubscriptionBody, createGLADAlertsISOURLSubscriptionBody,
    createGLADAlertsWDPAURLSubscriptionBody,
} = require('../utils/helpers/url-notifications');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();
chai.use(require('chai-datetime'));

const CHANNEL = config.get('apiGateway.queueName');
const redisClient = redis.createClient({ url: config.get('redis.url') });
redisClient.subscribe(CHANNEL);

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
        moment.locale('en');
    });

    it('Updating GLAD alerts dataset triggers the configured subscription url being called using the correct body data', async () => {
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsGeostoreQuery();

        createURLSubscriptionCallMock(createGLADAlertsGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));

        redisClient.on('message', (channel, message) => {
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

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Updating GLAD alerts dataset triggers the configured subscription url being called using the correct body data taking into account different languages', async () => {
        moment.locale('fr');
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' }, language: 'fr' },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsGeostoreQuery();

        createURLSubscriptionCallMock(createGLADAlertsGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
            glad_alert_type: 'alertes de déforestation (GLAD-L)'
        }));

        redisClient.on('message', (channel, message) => {
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

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
        moment.locale('en');
    });

    it('Updating GLAD alerts dataset triggers the configured subscription url being called using the correct body data - ISO code for country', async () => {
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { iso: { country: 'IDN' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsISOQuery();
        createMockGeostore('/v2/geostore/admin/IDN');

        createURLSubscriptionCallMock(createGLADAlertsISOURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
            selected_area: 'ISO Code: IDN',
        }));

        redisClient.on('message', (channel, message) => {
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

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Updating GLAD alerts dataset triggers the configured subscription url being called using the correct body data - ISO code for country and region', async () => {
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { iso: { country: 'IDN', region: '3' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsISOQuery();
        createMockGeostore('/v2/geostore/admin/IDN/3');

        createURLSubscriptionCallMock(createGLADAlertsISOURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
            selected_area: 'ISO Code: IDN, ID1: 3',
        }));

        redisClient.on('message', (channel, message) => {
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

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Updating GLAD alerts dataset triggers the configured subscription url being called using the correct body data - ISO code for country, region and subregion', async () => {
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { iso: { country: 'BRA', region: '1', subregion: '1' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsISOQuery();
        createMockGeostore('/v2/geostore/admin/BRA/1/1');

        createURLSubscriptionCallMock(createGLADAlertsISOURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
            selected_area: 'ISO Code: BRA, ID1: 1, ID2: 1',
        }));

        redisClient.on('message', (channel, message) => {
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

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Updating GLAD alerts dataset triggers the configured subscription url being called using the correct body data - WDPA ID', async () => {
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { wdpaid: '1' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsWDPAQuery();
        createMockGeostore('/v2/geostore/wdpa/1');

        createURLSubscriptionCallMock(createGLADAlertsWDPAURLSubscriptionBody(subscriptionOne, beginDate, endDate));

        redisClient.on('message', (channel, message) => {
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

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Updating GLAD alerts dataset triggers the configured subscription url being called using the correct body data - USE ID', async () => {
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { use: 'gfw_logging', useid: '29407' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsGeostoreQuery();
        createMockGeostore('/v2/geostore/use/gfw_logging/29407', 2);

        createURLSubscriptionCallMock(createGLADAlertsGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
            downloadUrls: {
                csv: `${config.get('dataApi.url')}/dataset/umd_glad_landsat_alerts/latest/download/csv?sql=SELECT latitude, longitude, umd_glad_landsat_alerts__date, umd_glad_landsat_alerts__confidence FROM data WHERE umd_glad_landsat_alerts__date >= '${beginDate.format('YYYY-MM-DD')}' AND umd_glad_landsat_alerts__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_origin=rw&geostore_id=f98f505878dcee72a2e92e7510a07d6f`,
                json: `${config.get('dataApi.url')}/dataset/umd_glad_landsat_alerts/latest/download/json?sql=SELECT latitude, longitude, umd_glad_landsat_alerts__date, umd_glad_landsat_alerts__confidence FROM data WHERE umd_glad_landsat_alerts__date >= '${beginDate.format('YYYY-MM-DD')}' AND umd_glad_landsat_alerts__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_origin=rw&geostore_id=f98f505878dcee72a2e92e7510a07d6f`
            },
        }));

        redisClient.on('message', (channel, message) => {
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

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Updating GLAD alerts dataset does not trigger the configured subscription url being called if no alerts are returned by the query', async () => {
        await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'glad-alerts',
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsGeostoreQuery(1, { data: [] }, 200);

        redisClient.on('message', (channel, message) => {
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

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Updating GLAD alerts dataset triggers the configured subscription url being called using the correct body data - Legacy params', async () => {
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
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
        mockGLADAlertsGeostoreQuery();

        createURLSubscriptionCallMock(createGLADAlertsGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));

        redisClient.on('message', (channel, message) => {
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

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    afterEach(async () => {
        redisClient.removeAllListeners();
        process.removeAllListeners('unhandledRejection');

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
        await Statistic.deleteMany({}).exec();
    });
});
