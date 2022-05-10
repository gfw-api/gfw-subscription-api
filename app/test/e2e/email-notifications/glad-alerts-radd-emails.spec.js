const chai = require('chai');
const nock = require('nock');
const config = require('config');
const redis = require('redis');

const Subscription = require('models/subscription');
const Statistic = require('models/statistic');
const AlertQueue = require('queues/alert.queue');

const { getTestServer } = require('../utils/test-server');
const { createSubscription } = require('../utils/helpers');
const { createMockGeostore } = require('../utils/mock');
const {
    bootstrapEmailNotificationTests,
    validateCommonNotificationParams,
    validateCustomMapURLs,
    validateGladRadd,
} = require('../utils/helpers/email-notifications');
const { ROLES } = require('../utils/test.constants');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();
chai.use(require('chai-datetime'));

const CHANNEL = config.get('apiGateway.queueName');
const redisClient = redis.createClient({ url: config.get('redis.url') });
redisClient.subscribe(CHANNEL);

describe('GLAD-RADD alerts', () => {

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

    it('GLAD-RADD alerts matches "glad-radd" for admin0 subscriptions, using the correct email template and providing the needed data', async () => {
        const sub = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-radd',
            { params: { iso: { country: 'BRA' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        createMockGeostore('/v2/geostore/admin/BRA');

        // Mock GFW Data API calls
        nock(config.get('dataApi.url'))
            .get('/dataset/gadm__integrated_alerts__iso_daily_alerts/latest/query')
            .query((data) => data.sql && data.sql.includes('iso=\'BRA\''))
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

        redisClient.on('message', (channel, message) => {
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

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('GLAD-RADD alerts matches "glad-radd" for admin1 subscriptions, using the correct email template and providing the needed data', async () => {
        const sub = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-radd',
            { params: { iso: { country: 'BRA', region: '1' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        createMockGeostore('/v2/geostore/admin/BRA/1');

        // Mock GFW Data API calls
        nock(config.get('dataApi.url'))
            .get('/dataset/gadm__integrated_alerts__adm1_daily_alerts/latest/query')
            .query((data) => data.sql && data.sql.includes('iso=\'BRA\'') && data.sql.includes('adm1=\'1\''))
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

        redisClient.on('message', (channel, message) => {
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

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('GLAD-RADD alerts matches "glad-radd" for admin2 subscriptions, using the correct email template and providing the needed data', async () => {
        const sub = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-radd',
            { params: { iso: { country: 'BRA', region: '1', subregion: '2' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        createMockGeostore('/v2/geostore/admin/BRA/1/2');

        // Mock GFW Data API calls
        nock(config.get('dataApi.url'))
            .get('/dataset/gadm__integrated_alerts__adm2_daily_alerts/latest/query')
            .query((data) => data.sql && data.sql.includes('iso=\'BRA\'') && data.sql.includes('adm1=\'1\'') && data.sql.includes('adm2=\'2\''))
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

        redisClient.on('message', (channel, message) => {
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

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('GLAD-RADD alerts matches "glad-radd" for WDPA subscriptions, using the correct email template and providing the needed data', async () => {
        const sub = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-radd',
            { params: { wdpaid: '1' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        createMockGeostore('/v2/geostore/wdpa/1');

        // Mock GFW Data API calls
        nock(config.get('dataApi.url'))
            .get('/dataset/wdpa_protected_areas__integrated_alerts__daily_alerts/latest/query')
            .query((data) => data.sql && data.sql.includes('wdpa_protected_area__id=\'1\''))
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

        redisClient.on('message', (channel, message) => {
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

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'glad-alerts',
            begin_date: beginDate,
            end_date: endDate
        }));
    });

    it('GLAD-RADD alerts matches "glad-radd" for custom geostore subscriptions, using the correct email template and providing the needed data', async () => {
        const sub = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-radd',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();

        // Mock GFW Data API calls
        nock(config.get('dataApi.url'))
            .get('/dataset/geostore__integrated_alerts__daily_alerts/latest/query')
            .query((data) => data.sql && data.sql.includes('geostore__id=\'423e5dfb0448e692f97b590c61f45f22\''))
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

        redisClient.on('message', (channel, message) => {
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
