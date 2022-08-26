import chai from 'chai';
import nock from 'nock';
import config from 'config';
import { createClient, RedisClientType } from 'redis';
import moment from 'moment';

import Subscription from 'models/subscription';
import Statistic from 'models/statistic';
import AlertQueue from 'queues/alert.queue';

import { getTestServer } from '../utils/test-server';
import { createURLSubscription, createURLSubscriptionCallMock } from '../utils/helpers';
import {
    createMockGeostore,
    mockVIIRSAlertsGeostoreQuery, mockVIIRSAlertsISOQuery,
    mockVIIRSAlertsWDPAQuery
} from '../utils/mock';
import { ROLES } from '../utils/test.constants';

import {
    assertSubscriptionStatsNotificationEvent,
    bootstrapEmailNotificationTests,
} from '../utils/helpers/email-notifications';
import EmailHelpersService from 'services/emailHelpersService';
import {
    createMonthlySummaryGeostoreURLSubscriptionBody,
    createMonthlySummaryISOURLSubscriptionBody, createMonthlySummaryWDPAURLSubscriptionBody
} from '../utils/mocks/monthlySummary.mocks';
import {
    mockGLADLAdm1Query,
    mockGLADLAdm2Query,
    mockGLADLGeostoreQuery,
    mockGLADLISOQuery, mockGLADLWDPAQuery
} from '../utils/mocks/gladL.mocks';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();
chai.use(require('chai-datetime'));

const CHANNEL: string = config.get('apiGateway.queueName');
let redisClient: RedisClientType;

describe('Monthly summary notifications - URL Subscriptions', () => {

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

        redisClient = createClient({ url: config.get('redis.url') });
        await redisClient.connect();
    });

    it('Updating monthly summary alerts dataset triggers subscription url being called using the correct body data', async () => {
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'monthly-summary',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADLGeostoreQuery(2);
        mockVIIRSAlertsGeostoreQuery(2);

        createURLSubscriptionCallMock(createMonthlySummaryGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));

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
            layer_slug: 'monthly-summary',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Updating monthly summary datasets triggers subscription url being called using the correct body data taking into account language differences (FR)', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('fr');
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'monthly-summary',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' }, language: 'fr' },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADLGeostoreQuery(2);
        mockVIIRSAlertsGeostoreQuery(2);

        createURLSubscriptionCallMock(createMonthlySummaryGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
            glad_frequency: 'moyenne',
            viirs_frequency: 'moyenne',
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
            layer_slug: 'monthly-summary',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Monthly summary alert for url subscriptions that refer to an ISO code work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'monthly-summary',
            { params: { iso: { country: 'BRA' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADLISOQuery(2);
        mockVIIRSAlertsISOQuery(2);

        createURLSubscriptionCallMock(createMonthlySummaryISOURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
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
            layer_slug: 'monthly-summary',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Monthly summary alert for url subscriptions that refer to an ADM 1 region work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'monthly-summary',
            { params: { iso: { country: 'BRA', region: '1' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADLAdm1Query(2);
        mockVIIRSAlertsISOQuery(2);

        createURLSubscriptionCallMock(createMonthlySummaryISOURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
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
            layer_slug: 'monthly-summary',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Monthly summary alert for url subscriptions that refer to an ADM 2 subregion work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'monthly-summary',
            { params: { iso: { country: 'BRA', region: '1', subregion: '2' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADLAdm2Query(2);
        mockVIIRSAlertsISOQuery(2);

        createURLSubscriptionCallMock(createMonthlySummaryISOURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
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
            layer_slug: 'monthly-summary',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Monthly summary alert for url subscriptions that refer to a WDPA ID work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'monthly-summary',
            { params: { wdpaid: '1' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADLWDPAQuery(2);
        mockVIIRSAlertsWDPAQuery(2);

        createURLSubscriptionCallMock(createMonthlySummaryWDPAURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
            selected_area: 'WDPA ID: 1',
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
            layer_slug: 'monthly-summary',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Monthly summary alert for url subscriptions that refer to a USE ID work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'monthly-summary',
            { params: { use: 'gfw_logging', useid: '29407' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADLGeostoreQuery(2);
        mockVIIRSAlertsGeostoreQuery(2);
        createMockGeostore('/v2/geostore/use/gfw_logging/29407', 4);

        createURLSubscriptionCallMock(createMonthlySummaryGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));

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
            layer_slug: 'monthly-summary',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('No url is called if there no alerts are returned by the monthly summary query', async () => {
        await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'monthly-summary',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADLGeostoreQuery(1, { data: [] }, 200);
        mockVIIRSAlertsGeostoreQuery(1, { data: [] }, 200);

        redisClient.subscribe(CHANNEL, (message) => {
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

        await AlertQueue.processMessage(JSON.stringify({
            layer_slug: 'monthly-summary',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Legacy subscription parameters are correctly handled, triggering subscription url being called using the correct body data', async () => {
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'monthly-summary',
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

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        // Despite the payload of the params object, geostore dataset should be used
        mockGLADLGeostoreQuery(2);
        mockVIIRSAlertsGeostoreQuery(2);

        createURLSubscriptionCallMock(createMonthlySummaryGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));

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
