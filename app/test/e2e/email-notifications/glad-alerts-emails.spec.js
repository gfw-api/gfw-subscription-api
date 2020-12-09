const chai = require('chai');
const nock = require('nock');
const config = require('config');
const moment = require('moment');
const redis = require('redis');

const Subscription = require('models/subscription');
const Statistic = require('models/statistic');
const AlertQueue = require('queues/alert.queue');
const EmailHelpersService = require('services/emailHelpersService');

const { getTestServer } = require('../utils/test-server');
const { createSubscription, assertNoEmailSent } = require('../utils/helpers');
const { mockGLADAlertsQuery, createMockGeostore } = require('../utils/mock');
const { bootstrapEmailNotificationTests, validateGLADNotificationParams } = require('../utils/helpers/email-notifications');
const { ROLES } = require('../utils/test.constants');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();
chai.use(require('chai-datetime'));

const CHANNEL = config.get('apiGateway.queueName');
const redisClient = redis.createClient({ url: config.get('redis.url') });
redisClient.subscribe(CHANNEL);

describe('GLAD alert emails', () => {

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

    it('Updating GLAD alerts dataset triggers a new email being queued using the correct email template and providing the needed data', async () => {
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsQuery(2);

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'forest-change-notification-glads-en':
                    validateGLADNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
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

    it('Updating GLAD alerts dataset triggers a new email being queued using the correct email template and providing the needed data taking into account language differences (FR)', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('fr');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' }, language: 'fr' },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsQuery(2);

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'forest-change-notification-glads-fr':
                    validateGLADNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne, 'moyenne');
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

    it('Updating GLAD alerts dataset triggers a new email being queued using the correct email template and providing the needed data taking into account language differences (ZH)', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('zh');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' }, language: 'zh' },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsQuery(2);

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'forest-change-notification-glads-zh':
                    validateGLADNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne, '平均');
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

    it('GLAD alert emails for subscriptions that refer to an ISO code work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { iso: { country: 'IDN' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsQuery(2, config.get('datasets.gladISODataset'));
        createMockGeostore('/v2/geostore/admin/IDN');

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'forest-change-notification-glads-en':
                    validateGLADNotificationParams(
                        jsonMessage,
                        beginDate,
                        endDate,
                        subscriptionOne,
                        'average',
                        'f98f505878dcee72a2e92e7510a07d6f',
                    );
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

    it('GLAD alert emails for subscriptions that refer to an ISO region work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { iso: { country: 'IDN', region: '3' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsQuery(2, config.get('datasets.gladISODataset'));
        createMockGeostore('/v2/geostore/admin/IDN/3');

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'forest-change-notification-glads-en':
                    validateGLADNotificationParams(
                        jsonMessage,
                        beginDate,
                        endDate,
                        subscriptionOne,
                        'average',
                        'f98f505878dcee72a2e92e7510a07d6f',
                    );
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

    it('GLAD alert emails for subscriptions that refer to an ISO subregion work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { iso: { country: 'BRA', region: '1', subregion: '1' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsQuery(2, config.get('datasets.gladISODataset'));
        createMockGeostore('/v2/geostore/admin/BRA/1/1');

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'forest-change-notification-glads-en':
                    validateGLADNotificationParams(
                        jsonMessage,
                        beginDate,
                        endDate,
                        subscriptionOne,
                        'average',
                        'f98f505878dcee72a2e92e7510a07d6f',
                    );
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

    it('GLAD alert emails for subscriptions that refer to a WDPA ID work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { wdpaid: '1' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsQuery(2, config.get('datasets.gladWDPADataset'));
        createMockGeostore('/v2/geostore/wdpa/1');

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'forest-change-notification-glads-en':
                    validateGLADNotificationParams(
                        jsonMessage,
                        beginDate,
                        endDate,
                        subscriptionOne,
                        'average',
                        'f98f505878dcee72a2e92e7510a07d6f',
                    );
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

    it('GLAD alert emails for subscriptions that refer to a USE ID work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { use: 'gfw_logging', useid: '29407' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsQuery(2);
        createMockGeostore('/v2/geostore/use/gfw_logging/29407', 3);

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'forest-change-notification-glads-en':
                    validateGLADNotificationParams(
                        jsonMessage,
                        beginDate,
                        endDate,
                        subscriptionOne,
                        'average',
                        'f98f505878dcee72a2e92e7510a07d6f',
                    );
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

    it('No email is sent if there no alerts are returned by the glad alerts query', async () => {
        await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsQuery(1, undefined, { data: [] });

        assertNoEmailSent(redisClient);

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Problems with intermediate calls do not result in an email being sent with incomplete data (second call failing)', async () => {
        await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsQuery(1);
        mockGLADAlertsQuery(1, undefined, {}, 500);

        assertNoEmailSent(redisClient);

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('GLAD alert values are correctly formatted with k and M when necessary', async () => {
        await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsQuery(2, undefined, {
            data: [
                {
                    alert__date: '2019-10-10',
                    is__confirmed_alert: false,
                    is__umd_regional_primary_forest_2001: false,
                    is__alliance_for_zero_extinction_site: false,
                    is__key_biodiversity_area: false,
                    is__landmark: false,
                    gfw_plantation__type: 0,
                    is__gfw_mining: true,
                    is__gfw_logging: false,
                    rspo_oil_palm__certification_status: 0,
                    is__gfw_wood_fiber: false,
                    is__peatland: false,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: 0,
                    per_forest_concession__type: 0,
                    is__gfw_oil_gas: false,
                    is__mangroves_2016: true,
                    is__ifl_intact_forest_landscape_2016: true,
                    bra_biome__name: 'Amazônia',
                    wdpa_protected_area__iucn_cat: 0,
                    alert__count: 56,
                    alert_area__ha: 0.45252535669866123,
                    aboveground_co2_emissions__Mg: 117.25617750097409,
                    _id: 'AW6O0fqMLu2ttL7ZDM5u'
                },
                {
                    alert__date: '2019-10-10',
                    is__confirmed_alert: false,
                    is__umd_regional_primary_forest_2001: true,
                    is__alliance_for_zero_extinction_site: false,
                    is__key_biodiversity_area: false,
                    is__landmark: false,
                    gfw_plantation__type: 0,
                    is__gfw_mining: true,
                    is__gfw_logging: false,
                    rspo_oil_palm__certification_status: 0,
                    is__gfw_wood_fiber: false,
                    is__peatland: false,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: 0,
                    per_forest_concession__type: 0,
                    is__gfw_oil_gas: false,
                    is__mangroves_2016: false,
                    is__ifl_intact_forest_landscape_2016: false,
                    bra_biome__name: 'Amazônia',
                    wdpa_protected_area__iucn_cat: 0,
                    alert__count: 999,
                    alert_area__ha: 0.45252535669866123,
                    aboveground_co2_emissions__Mg: 117.25617750097409,
                    _id: 'AW6O0fqMLu2ttL7ZDM5u'
                },
                {
                    alert__date: '2019-10-10',
                    is__confirmed_alert: false,
                    is__umd_regional_primary_forest_2001: false,
                    is__alliance_for_zero_extinction_site: false,
                    is__key_biodiversity_area: false,
                    is__landmark: false,
                    gfw_plantation__type: 0,
                    is__gfw_mining: true,
                    is__gfw_logging: false,
                    rspo_oil_palm__certification_status: 0,
                    is__gfw_wood_fiber: false,
                    is__peatland: true,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: 0,
                    per_forest_concession__type: 0,
                    is__gfw_oil_gas: false,
                    is__mangroves_2016: false,
                    is__ifl_intact_forest_landscape_2016: false,
                    bra_biome__name: 'Amazônia',
                    wdpa_protected_area__iucn_cat: 0,
                    alert__count: 8888,
                    alert_area__ha: 0.45252535669866123,
                    aboveground_co2_emissions__Mg: 117.25617750097409,
                    _id: 'AW6O0fqMLu2ttL7ZDM5u'
                },
                {
                    alert__date: '2019-10-10',
                    is__confirmed_alert: false,
                    is__umd_regional_primary_forest_2001: false,
                    is__alliance_for_zero_extinction_site: false,
                    is__key_biodiversity_area: false,
                    is__landmark: false,
                    gfw_plantation__type: 0,
                    is__gfw_mining: true,
                    is__gfw_logging: false,
                    rspo_oil_palm__certification_status: 0,
                    is__gfw_wood_fiber: false,
                    is__peatland: false,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: 0,
                    per_forest_concession__type: 0,
                    is__gfw_oil_gas: false,
                    is__mangroves_2016: false,
                    is__ifl_intact_forest_landscape_2016: false,
                    bra_biome__name: 'Amazônia',
                    wdpa_protected_area__iucn_cat: 'Other Category',
                    alert__count: 15000,
                    alert_area__ha: 0.45252535669866123,
                    aboveground_co2_emissions__Mg: 117.25617750097409,
                    _id: 'AW6O0fqMLu2ttL7ZDM5u'
                },
                {
                    alert__date: '2019-10-10',
                    is__confirmed_alert: false,
                    is__umd_regional_primary_forest_2001: false,
                    is__alliance_for_zero_extinction_site: false,
                    is__key_biodiversity_area: false,
                    is__landmark: false,
                    gfw_plantation__type: 'Fiber',
                    is__gfw_mining: true,
                    is__gfw_logging: false,
                    rspo_oil_palm__certification_status: 0,
                    is__gfw_wood_fiber: false,
                    is__peatland: false,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: 0,
                    per_forest_concession__type: 0,
                    is__gfw_oil_gas: false,
                    is__mangroves_2016: false,
                    is__ifl_intact_forest_landscape_2016: false,
                    bra_biome__name: 'Amazônia',
                    wdpa_protected_area__iucn_cat: 0,
                    alert__count: 1000000,
                    alert_area__ha: 0.45252535669866123,
                    aboveground_co2_emissions__Mg: 117.25617750097409,
                    _id: 'AW6O0fqMLu2ttL7ZDM5u'
                }
            ]
        });

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'forest-change-notification-glads-en':
                    jsonMessage.data.should.have.property('formatted_alert_count').and.equal('1M');
                    jsonMessage.data.should.have.property('formatted_priority_areas').and.deep.equal({
                        intact_forest: '56',
                        primary_forest: '999',
                        peat: '8.9k',
                        protected_areas: '15k',
                        plantations: '1M',
                        other: '0',
                    });
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

    it('Legacy subscription parameters are correctly handled, triggering a new email being queued using the correct email template with the correct data', async () => {
        const subscriptionOne = await new Subscription(createSubscription(
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
        // Despite the payload of the params object, geostore dataset should be used
        mockGLADAlertsQuery(2);

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'forest-change-notification-glads-en':
                    validateGLADNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
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

    it('GLAD subs referring to a Data API geostore ID should trigger an email with the correct email template and all the needed data', async () => {
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { geostoreDataApi: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockGLADAlertsQuery(2);

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'forest-change-notification-glads-en':
                    validateGLADNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
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
