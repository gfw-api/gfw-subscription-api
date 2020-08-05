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
const { createSubscription } = require('../utils/helpers');
const { mockGLADAlertsQuery, mockVIIRSAlertsQuery, createMockGeostore } = require('../utils/mock');
const { ROLES } = require('../utils/test.constants');

const {
    assertSubscriptionStatsNotificationEvent,
    bootstrapEmailNotificationTests,
    validateMonthlySummaryNotificationParams,
} = require('../utils/helpers/email-notifications');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();
chai.use(require('chai-datetime'));

const CHANNEL = config.get('apiGateway.queueName');
const redisClient = redis.createClient({ url: config.get('redis.url') });
redisClient.subscribe(CHANNEL);

describe('Monthly summary notifications', () => {

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

    it('Updating monthly summary alerts dataset triggers a new email being queued using the correct email template and providing the needed data', async () => {
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'monthly-summary',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADAlertsQuery(3);
        mockVIIRSAlertsQuery(3);

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'monthly-summary-en':
                    validateMonthlySummaryNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
                    break;
                case 'subscriptions-stats':
                    assertSubscriptionStatsNotificationEvent(jsonMessage);
                    break;
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }
        });

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'monthly-summary',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Updating monthly summary datasets triggers a new email being queued using the correct email template and providing the needed data taking into account language differences (FR)', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('fr');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'monthly-summary',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' }, language: 'fr' },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADAlertsQuery(3);
        mockVIIRSAlertsQuery(3);

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'monthly-summary-fr':
                    validateMonthlySummaryNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne, 'fr', 'moyenne');
                    break;
                case 'subscriptions-stats':
                    assertSubscriptionStatsNotificationEvent(jsonMessage);
                    break;
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }
        });

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'monthly-summary',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Updating monthly summary datasets triggers a new email being queued using the correct email template and providing the needed data taking into account language differences (ZH)', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('zh');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'monthly-summary',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' }, language: 'zh' },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADAlertsQuery(3);
        mockVIIRSAlertsQuery(3);

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'monthly-summary-zh':
                    validateMonthlySummaryNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne, 'zh', '平均');
                    break;
                case 'subscriptions-stats':
                    assertSubscriptionStatsNotificationEvent(jsonMessage);
                    break;
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }
        });

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'monthly-summary',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Monthly summary alert emails for subscriptions that refer to an ISO code work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'monthly-summary',
            { params: { iso: { country: 'IDN' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADAlertsQuery(3, config.get('datasets.gladISODataset'));
        mockVIIRSAlertsQuery(3, config.get('datasets.viirsISODataset'));

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'monthly-summary-en':
                    validateMonthlySummaryNotificationParams(
                        jsonMessage,
                        beginDate,
                        endDate,
                        subscriptionOne,
                        'en',
                        'average',
                    );
                    break;
                case 'subscriptions-stats':
                    assertSubscriptionStatsNotificationEvent(jsonMessage);
                    break;
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }
        });

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'monthly-summary',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Monthly summary alert emails for subscriptions that refer to an ISO region work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'monthly-summary',
            { params: { iso: { country: 'IDN', region: '3' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADAlertsQuery(3, config.get('datasets.gladISODataset'));
        mockVIIRSAlertsQuery(3, config.get('datasets.viirsISODataset'));

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'monthly-summary-en':
                    validateMonthlySummaryNotificationParams(
                        jsonMessage,
                        beginDate,
                        endDate,
                        subscriptionOne,
                        'en',
                        'average',
                    );
                    break;
                case 'subscriptions-stats':
                    assertSubscriptionStatsNotificationEvent(jsonMessage);
                    break;
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }
        });

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'monthly-summary',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Monthly summary alert emails for subscriptions that refer to an ISO subregion work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'monthly-summary',
            { params: { iso: { country: 'BRA', region: '1', subregion: '1' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADAlertsQuery(3, config.get('datasets.gladISODataset'));
        mockVIIRSAlertsQuery(3, config.get('datasets.viirsISODataset'));

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'monthly-summary-en':
                    validateMonthlySummaryNotificationParams(
                        jsonMessage,
                        beginDate,
                        endDate,
                        subscriptionOne,
                        'en',
                        'average',
                    );
                    break;
                case 'subscriptions-stats':
                    assertSubscriptionStatsNotificationEvent(jsonMessage);
                    break;
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }
        });

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'monthly-summary',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Monthly summary alert emails for subscriptions that refer to a WDPA ID work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'monthly-summary',
            { params: { wdpaid: '1' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADAlertsQuery(3, config.get('datasets.gladWDPADataset'));
        mockVIIRSAlertsQuery(3, config.get('datasets.viirsWDPADataset'));

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'monthly-summary-en':
                    validateMonthlySummaryNotificationParams(
                        jsonMessage,
                        beginDate,
                        endDate,
                        subscriptionOne,
                        'en',
                        'average',
                    );
                    break;
                case 'subscriptions-stats':
                    assertSubscriptionStatsNotificationEvent(jsonMessage);
                    break;
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }
        });

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'monthly-summary',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Monthly summary alert emails for subscriptions that refer to a USE ID work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'monthly-summary',
            { params: { use: 'gfw_logging', useid: '29407' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADAlertsQuery(3);
        mockVIIRSAlertsQuery(3);
        createMockGeostore('/v2/geostore/use/gfw_logging/29407', 6);

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'monthly-summary-en':
                    validateMonthlySummaryNotificationParams(
                        jsonMessage,
                        beginDate,
                        endDate,
                        subscriptionOne,
                        'en',
                        'average',
                    );
                    break;
                case 'subscriptions-stats':
                    assertSubscriptionStatsNotificationEvent(jsonMessage);
                    break;
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }
        });

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'monthly-summary',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('No email is sent if there no alerts are returned by the monthly summary query', async () => {
        await new Subscription(createSubscription(
            ROLES.USER.id,
            'monthly-summary',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADAlertsQuery(1, undefined, { data: [] });
        mockVIIRSAlertsQuery(1, undefined, { data: [] });

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'subscriptions-stats':
                    jsonMessage.should.have.property('sender').and.equal('gfw');
                    jsonMessage.should.have.property('data').and.be.a('object');
                    jsonMessage.data.should.have.property('counter').and.equal(0);
                    jsonMessage.data.should.have.property('dataset').and.equal('monthly-summary');
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
            layer_slug: 'monthly-summary',
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
