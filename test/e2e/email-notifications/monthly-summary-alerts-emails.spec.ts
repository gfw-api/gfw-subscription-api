import chai from 'chai';
import nock from 'nock';
import config from 'config';
import moment from 'moment';
import { createClient, RedisClientType } from 'redis';
import Subscription from 'models/subscription';
import Statistic from 'models/statistic';
import AlertQueue from 'queues/alert.queue';
import EmailHelpersService from 'services/emailHelpersService';
import { getTestServer } from '../utils/test-server';
import { createSubscriptionContent, assertNoEmailSent } from '../utils/helpers';
const {
    mockVIIRSAlertsISOQuery,
    mockVIIRSAlertsWDPAQuery,
    mockVIIRSAlertsGeostoreQuery,
    createMockGeostore,
} = require('../utils/mock');
const {
    bootstrapEmailNotificationTests,
    validateMonthlySummaryAlertsAndPriorityAreas,
    validateGLADSpecificParams,
    validateVIIRSSpecificParams,
    validateCommonNotificationParams,
} = require('../utils/helpers/email-notifications');
import { USERS } from '../utils/test.constants';
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

describe('Monthly summary notifications', () => {

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

    it('Updating monthly summary alerts dataset triggers a new email being queued using the correct email template and providing the needed data', async () => {
        const subscriptionOne = await new Subscription(createSubscriptionContent(
            USERS.USER.id,
            'monthly-summary',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADLGeostoreQuery(2);
        mockVIIRSAlertsGeostoreQuery(2);

        await redisClient.subscribe(CHANNEL, (message: string) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'monthly-summary-en':
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
                    validateGLADSpecificParams(jsonMessage, beginDate, endDate, subscriptionOne, 'average');
                    validateVIIRSSpecificParams(jsonMessage, beginDate, endDate, subscriptionOne, 'average');
                    validateMonthlySummaryAlertsAndPriorityAreas(jsonMessage, beginDate, endDate, subscriptionOne);
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

    it('Updating monthly summary datasets triggers a new email being queued using the correct email template and providing the needed data taking into account language differences (FR)', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('fr');
        const subscriptionOne = await new Subscription(createSubscriptionContent(
            USERS.USER.id,
            'monthly-summary',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' }, language: 'fr' },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADLGeostoreQuery(2);
        mockVIIRSAlertsGeostoreQuery(2);

        await redisClient.subscribe(CHANNEL, (message: string) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'monthly-summary-fr':
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
                    validateGLADSpecificParams(jsonMessage, beginDate, endDate, subscriptionOne, 'moyenne');
                    validateVIIRSSpecificParams(jsonMessage, beginDate, endDate, subscriptionOne, 'moyenne');
                    validateMonthlySummaryAlertsAndPriorityAreas(jsonMessage, beginDate, endDate, subscriptionOne);
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

    it('Updating monthly summary datasets triggers a new email being queued using the correct email template and providing the needed data taking into account language differences (ZH)', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('zh');
        const subscriptionOne = await new Subscription(createSubscriptionContent(
            USERS.USER.id,
            'monthly-summary',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' }, language: 'zh' },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADLGeostoreQuery(2);
        mockVIIRSAlertsGeostoreQuery(2);

        await redisClient.subscribe(CHANNEL, (message: string) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'monthly-summary-zh':
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
                    validateGLADSpecificParams(jsonMessage, beginDate, endDate, subscriptionOne, '平均');
                    validateVIIRSSpecificParams(jsonMessage, beginDate, endDate, subscriptionOne, '平均');
                    validateMonthlySummaryAlertsAndPriorityAreas(jsonMessage, beginDate, endDate, subscriptionOne);
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

    it('Monthly summary alert emails for subscriptions that refer to an ISO code work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscriptionContent(
            USERS.USER.id,
            'monthly-summary',
            { params: { iso: { country: 'BRA' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADLISOQuery(2);
        mockVIIRSAlertsISOQuery(2);

        await redisClient.subscribe(CHANNEL, (message: string) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'monthly-summary-en':
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
                    validateGLADSpecificParams(jsonMessage, beginDate, endDate, subscriptionOne, 'average');
                    validateVIIRSSpecificParams(jsonMessage, beginDate, endDate, subscriptionOne, 'average');
                    validateMonthlySummaryAlertsAndPriorityAreas(jsonMessage, beginDate, endDate, subscriptionOne, {
                        other: 25,
                        primary_forest: 175,
                        protected_areas: 100
                    });
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

    it('Monthly summary alert emails for subscriptions that refer to an ADM 1 region work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscriptionContent(
            USERS.USER.id,
            'monthly-summary',
            { params: { iso: { country: 'BRA', region: '1' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADLAdm1Query(2);
        mockVIIRSAlertsISOQuery(2);
        await redisClient.subscribe(CHANNEL, (message: string) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'monthly-summary-en':
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
                    validateGLADSpecificParams(jsonMessage, beginDate, endDate, subscriptionOne, 'average');
                    validateVIIRSSpecificParams(jsonMessage, beginDate, endDate, subscriptionOne, 'average');
                    validateMonthlySummaryAlertsAndPriorityAreas(jsonMessage, beginDate, endDate, subscriptionOne, {
                        other: 25,
                        primary_forest: 175,
                        protected_areas: 100
                    });
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

    it('Monthly summary alert emails for subscriptions that refer to an ADM 2 subregion work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscriptionContent(
            USERS.USER.id,
            'monthly-summary',
            { params: { iso: { country: 'BRA', region: '1', subregion: '2' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADLAdm2Query(2);
        mockVIIRSAlertsISOQuery(2);

        await redisClient.subscribe(CHANNEL, (message: string) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'monthly-summary-en':
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
                    validateGLADSpecificParams(jsonMessage, beginDate, endDate, subscriptionOne, 'average');
                    validateVIIRSSpecificParams(jsonMessage, beginDate, endDate, subscriptionOne, 'average');
                    validateMonthlySummaryAlertsAndPriorityAreas(jsonMessage, beginDate, endDate, subscriptionOne, {
                        other: 25,
                        primary_forest: 175,
                        protected_areas: 100
                    });
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

    it('Monthly summary alert emails for subscriptions that refer to a WDPA ID work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscriptionContent(
            USERS.USER.id,
            'monthly-summary',
            { params: { wdpaid: '1' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADLWDPAQuery(2);
        mockVIIRSAlertsWDPAQuery(2);

        await redisClient.subscribe(CHANNEL, (message: string) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'monthly-summary-en':
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
                    validateGLADSpecificParams(jsonMessage, beginDate, endDate, subscriptionOne, 'average');
                    validateVIIRSSpecificParams(jsonMessage, beginDate, endDate, subscriptionOne, 'average');
                    validateMonthlySummaryAlertsAndPriorityAreas(jsonMessage, beginDate, endDate, subscriptionOne, {
                        other: 0,
                        primary_forest: 125,
                        protected_areas: 200
                    });
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

    it('Monthly summary alert emails for subscriptions that refer to a USE ID work as expected', async () => {
        EmailHelpersService.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscriptionContent(
            USERS.USER.id,
            'monthly-summary',
            { params: { use: 'gfw_logging', useid: '29407' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADLGeostoreQuery(2);
        mockVIIRSAlertsGeostoreQuery(2);
        createMockGeostore('/v2/geostore/use/gfw_logging/29407', 4);

        await redisClient.subscribe(CHANNEL, (message: string) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'monthly-summary-en':
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
                    validateGLADSpecificParams(jsonMessage, beginDate, endDate, subscriptionOne, 'average');
                    validateVIIRSSpecificParams(jsonMessage, beginDate, endDate, subscriptionOne, 'average');
                    validateMonthlySummaryAlertsAndPriorityAreas(jsonMessage, beginDate, endDate, subscriptionOne);
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

    it('No email is sent if there no alerts are returned by the monthly summary query', async () => {
        await new Subscription(createSubscriptionContent(
            USERS.USER.id,
            'monthly-summary',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADLGeostoreQuery(1, { data: [] });
        mockVIIRSAlertsGeostoreQuery(1, { data: [] });

        assertNoEmailSent(redisClient);

        await AlertQueue.processMessage(JSON.stringify({
            layer_slug: 'monthly-summary',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('Monthly summary alerts are correctly formatted with k and M if values are high', async () => {
        await new Subscription(createSubscriptionContent(
            USERS.USER.id,
            'monthly-summary',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADLGeostoreQuery(2, {
            data: [{
                geostore__id: 'test',
                umd_glad_landsat_alerts__date: '2019-10-10',
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
                is__BRA_forest_moratorium: false,
                is__gfw_oil_palm: false,
                BRA_forest_area__type: 0,
                per_forest_concession__type: 0,
                is__gfw_oil_gas: false,
                is__mangroves_2016: true,
                is__ifl_intact_forest_landscape_2016: true,
                bra_biome__name: 'Amazônia',
                wdpa_protected_area__iucn_cat: 0,
                alert__count: 1000000,
                alert_area__ha: 0.45252535669866123,
                aboveground_co2_emissions__Mg: 117.25617750097409,
                _id: 'AW6O0fqMLu2ttL7ZDM5u'
            }]
        });
        mockVIIRSAlertsGeostoreQuery(2, { data: [] });

        await redisClient.subscribe(CHANNEL, (message: string) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'monthly-summary-en':
                    jsonMessage.data.should.have.property('formatted_alert_count').and.equal('1M');
                    jsonMessage.data.should.have.property('formatted_glad_count').and.equal('1M');
                    jsonMessage.data.should.have.property('formatted_viirs_count').and.equal('0');
                    jsonMessage.data.should.have.property('formatted_priority_areas').and.deep.equal({
                        intact_forest: '1M',
                        primary_forest: '0',
                        peat: '0',
                        protected_areas: '0',
                        plantations: '0',
                        other: '0',
                    });
                    jsonMessage.data.should.have.property('formatted_glad_priority_areas').and.deep.equal({
                        intact_forest: '1M',
                        primary_forest: '0',
                        peat: '0',
                        protected_areas: '0',
                        plantations: '0',
                        other: '0',
                    });
                    jsonMessage.data.should.have.property('formatted_viirs_priority_areas').and.deep.equal({
                        intact_forest: '0',
                        primary_forest: '0',
                        peat: '0',
                        protected_areas: '0',
                        plantations: '0',
                        other: '0',
                    });
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

    it('Monthly summary alerts are correctly formatted with k and M only if values are greater than 999', async () => {
        await new Subscription(createSubscriptionContent(
            USERS.USER.id,
            'monthly-summary',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests('1', 'month');
        mockGLADLGeostoreQuery(2, {
            data: [
                {
                    umd_glad_landsat_alerts__date: '2019-10-10',
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
                    is__BRA_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    BRA_forest_area__type: 0,
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
                    umd_glad_landsat_alerts__date: '2019-10-10',
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
                    is__BRA_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    BRA_forest_area__type: 0,
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
                    umd_glad_landsat_alerts__date: '2019-10-10',
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
                    is__BRA_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    BRA_forest_area__type: 0,
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
                    umd_glad_landsat_alerts__date: '2019-10-10',
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
                    is__BRA_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    BRA_forest_area__type: 0,
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
                    umd_glad_landsat_alerts__date: '2019-10-10',
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
                    is__BRA_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    BRA_forest_area__type: 0,
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
        mockVIIRSAlertsGeostoreQuery(2, { data: [] });

        await redisClient.subscribe(CHANNEL, (message: string) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'monthly-summary-en':
                    jsonMessage.data.should.have.property('formatted_alert_count').and.equal('1M');
                    jsonMessage.data.should.have.property('formatted_glad_count').and.equal('1M');
                    jsonMessage.data.should.have.property('formatted_viirs_count').and.equal('0');
                    jsonMessage.data.should.have.property('formatted_priority_areas').and.deep.equal({
                        intact_forest: '56',
                        primary_forest: '999',
                        peat: '8.9k',
                        protected_areas: '15k',
                        plantations: '1M',
                        other: '0',
                    });
                    jsonMessage.data.should.have.property('formatted_glad_priority_areas').and.deep.equal({
                        intact_forest: '56',
                        primary_forest: '999',
                        peat: '8.9k',
                        protected_areas: '15k',
                        plantations: '1M',
                        other: '0',
                    });
                    jsonMessage.data.should.have.property('formatted_viirs_priority_areas').and.deep.equal({
                        intact_forest: '0',
                        primary_forest: '0',
                        peat: '0',
                        protected_areas: '0',
                        plantations: '0',
                        other: '0',
                    });
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

    it('Legacy subscription parameters are correctly handled, triggering a new email being queued using the correct email template with the correct data', async () => {
        const subscriptionOne = await new Subscription(createSubscriptionContent(
            USERS.USER.id,
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

        await redisClient.subscribe(CHANNEL, (message: string) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('template');
            switch (jsonMessage.template) {

                case 'monthly-summary-en':
                    validateCommonNotificationParams(jsonMessage, beginDate, endDate, subscriptionOne);
                    validateGLADSpecificParams(jsonMessage, beginDate, endDate, subscriptionOne, 'average');
                    validateVIIRSSpecificParams(jsonMessage, beginDate, endDate, subscriptionOne, 'average');
                    validateMonthlySummaryAlertsAndPriorityAreas(jsonMessage, beginDate, endDate, subscriptionOne);
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
        await redisClient.unsubscribe(CHANNEL);
        process.removeAllListeners('unhandledRejection');

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
        await Statistic.deleteMany({}).exec();
    });
});
