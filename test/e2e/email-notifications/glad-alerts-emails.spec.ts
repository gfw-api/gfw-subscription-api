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

        // Mock GFW Data API calls
        nock(config.get('dataApi.url'))
            .get('/dataset/geostore__glad__daily_alerts/latest/query')
            .query((data) => data.sql && data.sql.includes('geostore__id = \'423e5dfb0448e692f97b590c61f45f22\''))
            .matchHeader('x-api-key', config.get('dataApi.apiKey'))
            .matchHeader('origin', config.get('dataApi.origin'))
            .reply(200, {
                data: [
                    {
                        wdpa_protected_area__iucn_cat: 'Category 1',
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: true,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: true,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: true,
                        alert__count: 100,
                        alert_area__ha: 10,
                    }
                ],
                status: 'success'
            });

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

        // Mock GFW Data API calls
        nock(config.get('dataApi.url'))
            .get('/dataset/geostore__glad__daily_alerts/latest/query')
            .query((data) => data.sql && data.sql.includes('geostore__id = \'423e5dfb0448e692f97b590c61f45f22\''))
            .matchHeader('x-api-key', config.get('dataApi.apiKey'))
            .matchHeader('origin', config.get('dataApi.origin'))
            .reply(200, {
                data: [
                    {
                        wdpa_protected_area__iucn_cat: 'Category 1',
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: true,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: true,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: true,
                        alert__count: 100,
                        alert_area__ha: 10,
                    }
                ],
                status: 'success'
            });

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

        // Mock GFW Data API calls
        nock(config.get('dataApi.url'))
            .get('/dataset/geostore__glad__daily_alerts/latest/query')
            .query((data) => data.sql && data.sql.includes('geostore__id = \'423e5dfb0448e692f97b590c61f45f22\''))
            .matchHeader('x-api-key', config.get('dataApi.apiKey'))
            .matchHeader('origin', config.get('dataApi.origin'))
            .reply(200, {
                data: [
                    {
                        wdpa_protected_area__iucn_cat: 'Category 1',
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: true,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: true,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: true,
                        alert__count: 100,
                        alert_area__ha: 10,
                    }
                ],
                status: 'success'
            });

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

        // Mock GFW Data API calls
        nock(config.get('dataApi.url'))
            .get('/dataset/gadm__glad__adm2_daily_alerts/latest/query')
            .query((data) => data.sql && data.sql.includes('iso = \'BRA\''))
            .matchHeader('x-api-key', config.get('dataApi.apiKey'))
            .matchHeader('origin', config.get('dataApi.origin'))
            .reply(200, {
                data: [
                    {
                        wdpa_protected_area__iucn_cat: 'Category 1',
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: true,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: true,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: true,
                        alert__count: 100,
                        alert_area__ha: 10,
                    }
                ],
                status: 'success'
            });

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

        // Mock GFW Data API calls
        nock(config.get('dataApi.url'))
            .get('/dataset/gadm__glad__adm2_daily_alerts/latest/query')
            .query((data) => data.sql && data.sql.includes('iso = \'BRA\'') && data.sql.includes('adm1 = \'1\''))
            .matchHeader('x-api-key', config.get('dataApi.apiKey'))
            .matchHeader('origin', config.get('dataApi.origin'))
            .reply(200, {
                data: [
                    {
                        wdpa_protected_area__iucn_cat: 'Category 1',
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: true,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: true,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: true,
                        alert__count: 100,
                        alert_area__ha: 10,
                    }
                ],
                status: 'success'
            });

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

        // Mock GFW Data API calls
        nock(config.get('dataApi.url'))
            .get('/dataset/gadm__glad__adm2_daily_alerts/latest/query')
            .query((data) => data.sql && data.sql.includes('iso = \'BRA\'') && data.sql.includes('adm1 = \'1\'') && data.sql.includes('adm2 = \'2\''))
            .matchHeader('x-api-key', config.get('dataApi.apiKey'))
            .matchHeader('origin', config.get('dataApi.origin'))
            .reply(200, {
                data: [
                    {
                        wdpa_protected_area__iucn_cat: 'Category 1',
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: true,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: true,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: true,
                        alert__count: 100,
                        alert_area__ha: 10,
                    }
                ],
                status: 'success'
            });

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

        // Mock GFW Data API calls
        nock(config.get('dataApi.url'))
            .get('/dataset/wdpa_protected_areas__glad__daily_alerts/latest/query')
            .query((data) => data.sql && data.sql.includes('wdpa_protected_area__id = \'1\''))
            .matchHeader('x-api-key', config.get('dataApi.apiKey'))
            .matchHeader('origin', config.get('dataApi.origin'))
            .reply(200, {
                data: [
                    {
                        wdpa_protected_area__iucn_cat: 'Category 1',
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: true,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: true,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: true,
                        alert__count: 100,
                        alert_area__ha: 10,
                    }
                ],
                status: 'success'
            });

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

        // Mock GFW Data API calls
        nock(config.get('dataApi.url'))
            .get('/dataset/geostore__glad__daily_alerts/latest/query')
            .query((data) => data.sql && data.sql.includes('geostore__id = \'f98f505878dcee72a2e92e7510a07d6f\''))
            .matchHeader('x-api-key', config.get('dataApi.apiKey'))
            .matchHeader('origin', config.get('dataApi.origin'))
            .reply(200, {
                data: [
                    {
                        wdpa_protected_area__iucn_cat: 'Category 1',
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: true,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: true,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: true,
                        alert__count: 100,
                        alert_area__ha: 10,
                    }
                ],
                status: 'success'
            });

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
        nock(config.get('dataApi.url'))
            .get('/dataset/geostore__glad__daily_alerts/latest/query')
            .query((data) => data.sql && data.sql.includes('geostore__id = \'423e5dfb0448e692f97b590c61f45f22\''))
            .matchHeader('x-api-key', config.get('dataApi.apiKey'))
            .matchHeader('origin', config.get('dataApi.origin'))
            .reply(200, { data: [], status: 'success' });

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
        nock(config.get('dataApi.url'))
            .get('/dataset/geostore__glad__daily_alerts/latest/query')
            .query((data) => data.sql && data.sql.includes('geostore__id = \'423e5dfb0448e692f97b590c61f45f22\''))
            .matchHeader('x-api-key', config.get('dataApi.apiKey'))
            .matchHeader('origin', config.get('dataApi.origin'))
            .reply(200, {
                data: [
                    {
                        wdpa_protected_area__iucn_cat: 'Category 1',
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: true,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: true,
                        is__ifl_intact_forest_landscape_2016: false,
                        alert__count: 100,
                        alert_area__ha: 10,
                    },
                    {
                        wdpa_protected_area__iucn_cat: null,
                        is__umd_regional_primary_forest_2001: false,
                        is__peatland: false,
                        is__ifl_intact_forest_landscape_2016: true,
                        alert__count: 100,
                        alert_area__ha: 10,
                    }
                ],
                status: 'success'
            });

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
        await redisClient.unsubscribe(CHANNEL);;
        process.removeAllListeners('unhandledRejection');

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
        await Statistic.deleteMany({}).exec();
    });
});
