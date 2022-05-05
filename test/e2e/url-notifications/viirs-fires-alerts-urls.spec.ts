import chai from 'chai';
import nock from 'nock';
import config from 'config';
import moment from 'moment';
import { createClient, RedisClientType } from 'redis';

import Subscription from  'models/subscription';
import Statistic from  'models/statistic';
import AlertQueue from  'queues/alert.queue';
import EmailHelpersService from 'services/emailHelpersService';

import { getTestServer } from  '../utils/test-server';
import { createURLSubscription, createURLSubscriptionCallMock } from  '../utils/helpers';
import {
    mockVIIRSAlertsGeostoreQuery, createMockGeostore, mockVIIRSAlertsISOQuery, mockVIIRSAlertsWDPAQuery
} from '../utils/mock';
import { ROLES } from  '../utils/test.constants';

import {
    assertSubscriptionStatsNotificationEvent,
    bootstrapEmailNotificationTests,
} from  '../utils/helpers/email-notifications';
import {
    createViirsFireAlertsGeostoreURLSubscriptionBody,
    createViirsFireAlertsISOURLSubscriptionBody, createViirsFireAlertsWDPAURLSubscriptionBody
} from '../utils/helpers/url-notifications';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();
chai.use(require('chai-datetime'));

const CHANNEL: string = config.get('apiGateway.queueName');
let redisClient: RedisClientType;

describe('VIIRS Fires alert - URL Subscriptions', () => {

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

    it('Updating VIIRS Fires dataset triggers a new email being queued using the correct email template and providing the needed data', async () => {
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'viirs-active-fires',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockVIIRSAlertsGeostoreQuery(2);

        createURLSubscriptionCallMock(createViirsFireAlertsGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));

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
            layer_slug: 'viirs-active-fires',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Updating VIIRS Fires dataset triggers a new email being queued using the correct email template and providing the needed data taking into account language differences (FR)', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('fr');
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'viirs-active-fires',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' }, language: 'fr' },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockVIIRSAlertsGeostoreQuery(2);

        createURLSubscriptionCallMock(createViirsFireAlertsGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
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
            layer_slug: 'viirs-active-fires',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('VIIRS Fires emails for subscriptions that refer to an ISO code work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'viirs-active-fires',
            { params: { iso: { country: 'IDN' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockVIIRSAlertsISOQuery(2, config.get('datasets.viirsISODataset'));
        createMockGeostore('/v2/geostore/admin/IDN');

        createURLSubscriptionCallMock(createViirsFireAlertsISOURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
            selected_area: 'ISO Code: IDN',
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
            layer_slug: 'viirs-active-fires',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('VIIRS Fires emails for subscriptions that refer to an ISO region work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'viirs-active-fires',
            { params: { iso: { country: 'IDN', region: '3' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockVIIRSAlertsISOQuery(2, config.get('datasets.viirsISODataset'));
        createMockGeostore('/v2/geostore/admin/IDN/3');

        createURLSubscriptionCallMock(createViirsFireAlertsISOURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
            selected_area: 'ISO Code: IDN, ID1: 3',
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
            layer_slug: 'viirs-active-fires',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('VIIRS Fires emails for subscriptions that refer to an ISO subregion work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'viirs-active-fires',
            { params: { iso: { country: 'BRA', region: '1', subregion: '1' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockVIIRSAlertsISOQuery(2, config.get('datasets.viirsISODataset'));
        createMockGeostore('/v2/geostore/admin/BRA/1/1');

        createURLSubscriptionCallMock(createViirsFireAlertsISOURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
            selected_area: 'ISO Code: BRA, ID1: 1, ID2: 1',
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
            layer_slug: 'viirs-active-fires',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('VIIRS Fires emails for subscriptions that refer to a WDPA ID work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'viirs-active-fires',
            { params: { wdpaid: '1' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockVIIRSAlertsWDPAQuery(2, config.get('datasets.viirsWDPADataset'));
        createMockGeostore('/v2/geostore/wdpa/1');

        createURLSubscriptionCallMock(createViirsFireAlertsWDPAURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
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
            layer_slug: 'viirs-active-fires',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('VIIRS Fires emails for subscriptions that refer to a USE ID work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'viirs-active-fires',
            { params: { use: 'gfw_logging', useid: '29407' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockVIIRSAlertsGeostoreQuery(2);
        createMockGeostore('/v2/geostore/use/gfw_logging/29407', 3);

        createURLSubscriptionCallMock(createViirsFireAlertsGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate, {
            downloadUrls: {
                csv: `${config.get('dataApi.url')}/dataset/nasa_viirs_fire_alerts/latest/download/csv?sql=SELECT latitude, longitude, alert__date, confidence__cat, is__ifl_intact_forest_landscape_2016 as in_intact_forest, is__umd_regional_primary_forest_2001 as in_primary_forest, is__peatland as in_peat, CASE WHEN wdpa_protected_area__iucn_cat <> '' THEN 'True' ELSE 'False' END as in_protected_areas FROM nasa_viirs_fire_alerts WHERE alert__date > '${beginDate.format('YYYY-MM-DD')}' AND alert__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_id=f98f505878dcee72a2e92e7510a07d6f&geostore_origin=rw`,
                json: `${config.get('dataApi.url')}/dataset/nasa_viirs_fire_alerts/latest/download/json?sql=SELECT latitude, longitude, alert__date, confidence__cat, is__ifl_intact_forest_landscape_2016 as in_intact_forest, is__umd_regional_primary_forest_2001 as in_primary_forest, is__peatland as in_peat, CASE WHEN wdpa_protected_area__iucn_cat <> '' THEN 'True' ELSE 'False' END as in_protected_areas FROM nasa_viirs_fire_alerts WHERE alert__date > '${beginDate.format('YYYY-MM-DD')}' AND alert__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_id=f98f505878dcee72a2e92e7510a07d6f&geostore_origin=rw`
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
            layer_slug: 'viirs-active-fires',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('No email is sent if there no alerts are returned by the VIIRS Fires alerts query', async () => {
        await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'viirs-active-fires',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        mockVIIRSAlertsGeostoreQuery(1, { data: [] }, 200);

        redisClient.subscribe(CHANNEL, (message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'subscriptions-stats':
                    jsonMessage.should.have.property('sender').and.equal('gfw');
                    jsonMessage.should.have.property('data').and.be.a('object');
                    jsonMessage.data.should.have.property('counter').and.equal(0);
                    jsonMessage.data.should.have.property('dataset').and.equal('viirs-active-fires');
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
            layer_slug: 'viirs-active-fires',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Legacy subscription parameters are correctly handled, triggering a new email being queued using the correct email template with the correct data', async () => {
        const subscriptionOne = await new Subscription(createURLSubscription(
            ROLES.USER.id,
            'viirs-active-fires',
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
        mockVIIRSAlertsGeostoreQuery(2);

        createURLSubscriptionCallMock(createViirsFireAlertsGeostoreURLSubscriptionBody(subscriptionOne, beginDate, endDate));

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
            layer_slug: 'viirs-active-fires',
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
