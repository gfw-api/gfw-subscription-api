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
    validateCustomMapURLs, validateGladAll,
} = require('../utils/helpers/email-notifications');
const { ROLES } = require('../utils/test.constants');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();
chai.use(require('chai-datetime'));

const CHANNEL = config.get('apiGateway.queueName');
const redisClient = redis.createClient({ url: config.get('redis.url') });
redisClient.subscribe(CHANNEL);

describe('GLAD-ALL alert emails', () => {

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

    it('Daily cron processing GLAD alerts matches subscriptions for "glad-all" for ISO code use the correct email template and provide the needed data', async () => {
        const sub = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-all',
            { params: { iso: { country: 'BRA' } } },
        )).save();

        const { beginDate, endDate } = bootstrapEmailNotificationTests();
        createMockGeostore('/v2/geostore/admin/BRA');

        // Mock GFW Data API calls
        nock(config.get('dataApi.url'))
            .get('/dataset/gadm__integrated_alerts__iso_daily_alerts/latest/query')
            .query((data) => data.sql && data.sql.includes('iso="BRA"'))
            .matchHeader('x-api-key', config.get('dataApi.apiKey'))
            .matchHeader('origin', config.get('dataApi.origin'))
            .times(2)
            .reply(200, {
                data: [
                    {
                        iso: 'BRA',
                        wdpa_protected_area__iucn_cat: null,
                        umd_glad_landsat_alerts__date: '2021-10-07',
                        umd_glad_sentinel2_alerts__date: null,
                        wur_radd_alerts__date: null,
                        gfw_integrated_alerts__date: '2021-10-07',
                        umd_glad_landsat_alerts__confidence: 'nominal',
                        umd_glad_sentinel2_alerts__confidence: 'not_detected',
                        wur_radd_alerts__confidence: 'not_detected',
                        gfw_integrated_alerts__confidence: 'nominal',
                        is__umd_regional_primary_forest_2001: false,
                        is__birdlife_alliance_for_zero_extinction_site: false,
                        is__birdlife_key_biodiversity_area: false,
                        is__landmark_land_right: true,
                        gfw_plantation__type: null,
                        is__gfw_mining: false,
                        is__gfw_managed_forest: false,
                        rspo_oil_palm__certification_status: null,
                        is__gfw_wood_fiber: false,
                        is__peatland: false,
                        is__idn_forest_moratorium: false,
                        is__gfw_oil_palm: false,
                        idn_forest_area__type: null,
                        per_forest_concession__type: null,
                        is__gfw_oil_gas: false,
                        is__gmw_mangroves_2016: false,
                        is__ifl_intact_forest_landscape_2016: false,
                        bra_biome__name: 'Not applicable',
                        alert__count: 1226,
                        alert_area__ha: 14.101432329872557,
                        whrc_aboveground_co2_emissions__Mg: 3743.7387714008505
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
                    validateGladAll(jsonMessage, sub, beginDate, endDate, 1226);
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
