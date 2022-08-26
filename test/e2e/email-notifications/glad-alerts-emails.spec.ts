import chai from 'chai';
import nock from 'nock';
import config from 'config';
import moment from 'moment';
import { createClient, RedisClientType } from 'redis';

import Subscription from 'models/subscription';
import Statistic from 'models/statistic';
import AlertQueue from 'queues/alert.queue';
import EmailHelpersService from 'services/emailHelpersService';

import { createSubscriptionContent, assertNoEmailSent } from '../utils/helpers';
import { createMockGeostore } from '../utils/mock';
const {
    bootstrapEmailNotificationTests,
    validateCommonNotificationParams,
    validateCustomMapURLs,
    validateGladL,
} = require('../utils/helpers/email-notifications');
import { ROLES } from '../utils/test.constants';
import {
    mockGLADLAdm1Query, mockGLADLAdm2Query,
    mockGLADLGeostoreQuery,
    mockGLADLISOQuery,
    mockGLADLWDPAQuery
} from '../utils/mocks/gladL.mocks';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();
chai.use(require('chai-datetime'));

const CHANNEL: string = config.get('apiGateway.queueName');

let redisClient: RedisClientType;


describe('GLAD-ALL emails (existing "glad-alerts" subscriptions should now use "glad-all" service)', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        if (config.get('settings.loadCron') && config.get('settings.loadCron') !== 'false') {
            throw Error(`Running the test suite with cron enabled is not supported. You can disable cron by setting the LOAD_CRON env variable to false.`);
        }

        redisClient = createClient({ url: config.get('redis.url') });
        await redisClient.connect();
    });

    it('Updating GLAD alerts dataset triggers a new email being queued using the correct email template and providing the needed data', async () => {
        const subscriptionOne = await new Subscription(createSubscriptionContent(
            ROLES.USER.id,
            'glad-alerts',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();

        mockGLADLGeostoreQuery();

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'glad-updated-notification-en':
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
                    validateCustomMapURLs(jsonMessage);
                    validateGladL(jsonMessage, subscriptionOne, beginDate, endDate,
                        {
                            total: 400,
                            area: '40',
                            intactForestArea: '10',
                            primaryForestArea: '10',
                            peatArea: '10',
                            wdpaArea: '10'
                        });
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

    it('Updating GLAD alerts dataset triggers a new email being queued using the correct email template and providing the needed data taking into account language differences (FR)', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('fr');
        const subscriptionOne = await new Subscription(createSubscriptionContent(
            ROLES.USER.id,
            'glad-alerts',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' }, language: 'fr' },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();

        mockGLADLGeostoreQuery();

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'glad-updated-notification-fr':
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
                    validateCustomMapURLs(jsonMessage);
                    validateGladL(jsonMessage, subscriptionOne, beginDate, endDate,
                        {
                            total: 400,
                            area: '40',
                            intactForestArea: '10',
                            primaryForestArea: '10',
                            peatArea: '10',
                            wdpaArea: '10',
                            lang: 'fr'
                        });
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

    it('Updating GLAD alerts dataset triggers a new email being queued using the correct email template and providing the needed data taking into account language differences (ZH)', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('zh');
        const subscriptionOne = await new Subscription(createSubscriptionContent(
            ROLES.USER.id,
            'glad-alerts',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' }, language: 'zh' },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();

        mockGLADLGeostoreQuery();

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'glad-updated-notification-zh':
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
                    validateCustomMapURLs(jsonMessage);
                    validateGladL(jsonMessage, subscriptionOne, beginDate, endDate,
                        {
                            total: 400,
                            area: '40',
                            intactForestArea: '10',
                            primaryForestArea: '10',
                            peatArea: '10',
                            wdpaArea: '10',
                            lang: 'zh'
                        });
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

    it('GLAD alert emails for admin 0 subscriptions work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscriptionContent(
            ROLES.USER.id,
            'glad-alerts',
            { params: { iso: { country: 'BRA' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        createMockGeostore('/v2/geostore/admin/BRA');

        mockGLADLISOQuery();

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'glad-updated-notification-en':
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
                    validateCustomMapURLs(jsonMessage);
                    validateGladL(jsonMessage, subscriptionOne, beginDate, endDate,
                        {
                            total: 400,
                            area: '40',
                            intactForestArea: '10',
                            primaryForestArea: '10',
                            peatArea: '10',
                            wdpaArea: '10'
                        });
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

    it('GLAD alert emails for admin 1 subscriptions work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscriptionContent(
            ROLES.USER.id,
            'glad-alerts',
            { params: { iso: { country: 'BRA', region: '1' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        createMockGeostore('/v2/geostore/admin/BRA/1');

        mockGLADLAdm1Query();

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'glad-updated-notification-en':
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
                    validateCustomMapURLs(jsonMessage);
                    validateGladL(jsonMessage, subscriptionOne, beginDate, endDate,
                        {
                            total: 400,
                            area: '40',
                            intactForestArea: '10',
                            primaryForestArea: '10',
                            peatArea: '10',
                            wdpaArea: '10'
                        });
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

    it('GLAD alert emails for admin 2 subscriptions work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscriptionContent(
            ROLES.USER.id,
            'glad-alerts',
            { params: { iso: { country: 'BRA', region: '1', subregion: '2' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        createMockGeostore('/v2/geostore/admin/BRA/1/2');

        mockGLADLAdm2Query();

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'glad-updated-notification-en':
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
                    validateCustomMapURLs(jsonMessage);
                    validateGladL(jsonMessage, subscriptionOne, beginDate, endDate,
                        {
                            total: 400,
                            area: '40',
                            intactForestArea: '10',
                            primaryForestArea: '10',
                            peatArea: '10',
                            wdpaArea: '10'
                        });
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

    it('GLAD alert emails for WDPA subscriptions work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscriptionContent(
            ROLES.USER.id,
            'glad-alerts',
            { params: { wdpaid: '1' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        createMockGeostore('/v2/geostore/wdpa/1');

        mockGLADLWDPAQuery();

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'glad-updated-notification-en':
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
                    validateCustomMapURLs(jsonMessage);
                    validateGladL(jsonMessage, subscriptionOne, beginDate, endDate,
                        {
                            total: 400,
                            area: '40',
                            intactForestArea: '10',
                            primaryForestArea: '10',
                            peatArea: '10',
                            wdpaArea: '10'
                        });
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

    it('GLAD alert emails for subscriptions that refer to a USE ID work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscriptionContent(
            ROLES.USER.id,
            'glad-alerts',
            { params: { use: 'gfw_logging', useid: '29407' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        createMockGeostore('/v2/geostore/use/gfw_logging/29407', 2);

        mockGLADLGeostoreQuery()

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'glad-updated-notification-en':
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
                    validateCustomMapURLs(jsonMessage);
                    validateGladL(jsonMessage, subscriptionOne, beginDate, endDate,
                        {
                            total: 400,
                            area: '40',
                            intactForestArea: '10',
                            primaryForestArea: '10',
                            peatArea: '10',
                            wdpaArea: '10'
                        });
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

    it('No email is sent if there no alerts are returned by the glad alerts query', async () => {
        await new Subscription(createSubscriptionContent(
            ROLES.USER.id,
            'glad-alerts',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();

        // Mock GFW Data API calls
        mockGLADLGeostoreQuery()

        assertNoEmailSent(redisClient);

        await AlertQueue.processMessage(JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Legacy subscription parameters are correctly handled, triggering a new email being queued using the correct email template with the correct data', async () => {
        const subscriptionOne = await new Subscription(createSubscriptionContent(
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
        mockGLADLGeostoreQuery();

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'glad-updated-notification-en':
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
                    validateCustomMapURLs(jsonMessage);
                    validateGladL(jsonMessage, subscriptionOne, beginDate, endDate,
                        {
                            total: 400,
                            area: '40',
                            intactForestArea: '10',
                            primaryForestArea: '10',
                            peatArea: '10',
                            wdpaArea: '10'
                        });
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
        await redisClient.unsubscribe(CHANNEL);
        moment.locale('en');
        process.removeAllListeners('unhandledRejection');

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
        await Statistic.deleteMany({}).exec();
    });
});
