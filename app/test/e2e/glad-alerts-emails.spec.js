const chai = require('chai');
const nock = require('nock');
const config = require('config');
const moment = require('moment');
const Subscription = require('models/subscription');
const Statistic = require('models/statistic');
const redis = require('redis');
const { getTestServer } = require('./utils/test-server');

const { createSubscription } = require('./utils/helpers');
const { createMockAlertsQuery } = require('./utils/mock');
const { ROLES } = require('./utils/test.constants');

const AlertQueue = require('../../src/queues/alert.queue');

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

        const beginDate = moment().subtract('1', 'w');
        const endDate = moment();

        nock(process.env.CT_URL)
            .get('/v1/glad-alerts/')
            .query({
                period: `${beginDate.format('YYYY-MM-DD')},${endDate.format('YYYY-MM-DD')}`,
                geostore: '423e5dfb0448e692f97b590c61f45f22'
            })
            .reply(200, {
                data: {
                    attributes: {
                        areaHa: 22435351.3660182,
                        downloadUrls: {
                            // eslint-disable-next-line max-len
                            csv: '/glad-alerts/download/?period=2020-02-22,2020-03-04&gladConfirmOnly=False&aggregate_values=False&aggregate_by=False&geostore=423e5dfb0448e692f97b590c61f45f22&format=csv',
                            // eslint-disable-next-line max-len
                            json: '/glad-alerts/download/?period=2020-02-22,2020-03-04&gladConfirmOnly=False&aggregate_values=False&aggregate_by=False&geostore=423e5dfb0448e692f97b590c61f45f22&format=json'
                        },
                        value: 5
                    },
                    gladConfirmOnly: false,
                    id: '20892bc2-5601-424d-8a4a-605c319418a2',
                    period: '2020-02-22,2020-03-04',
                    type: 'glad-alerts'
                }
            });

        createMockAlertsQuery(config.get('datasets.gladAlertsDataset'));

        process.on('unhandledRejection', (error) => {
            should.fail(error);
        });

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'forest-change-notification-no-chart-copy-en':
                    jsonMessage.should.have.property('sender').and.equal('gfw');
                    jsonMessage.should.have.property('data').and.be.a('object');

                    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
                    jsonMessage.recipients[0].should.be.an('object').and.have.property('address').and.have.property('email').and.equal('subscription-recipient@vizzuality.com');

                    // TODO: fix the missing values
                    // image_url_big : same AOI image as before, but now 350px tall and 700px wide.
                    jsonMessage.data.should.have.property('image_url_big').and.equal('example image');
                    jsonMessage.data.should.have.property('image_source').and.equal('');
                    jsonMessage.data.should.have.property('glad_frequency').and.equal('normal');

                    jsonMessage.data.should.have.property('month').and.equal(beginDate.format('MMMM'));
                    jsonMessage.data.should.have.property('year').and.equal(beginDate.format('YYYY'));
                    jsonMessage.data.should.have.property('week_of').and.equal(`${beginDate.format('Do')} of ${beginDate.format('MMMM')}`);
                    jsonMessage.data.should.have.property('week_start').and.equal(beginDate.format('DD/MM/YYYY'));
                    jsonMessage.data.should.have.property('week_end').and.equal(endDate.format('DD/MM/YYYY'));
                    jsonMessage.data.should.have.property('priority_areas').and.deep.equal({
                        intact_forest: 6,
                        primary_forest: 7,
                        peat: 8,
                        protected_areas: 9,
                        plantations: 10,
                        other: 11
                    });
                    jsonMessage.data.should.have.property('glad_count').and.equal(51);
                    jsonMessage.data.should.have.property('glad_alerts').and.deep.equal({
                        intact_forest: 6,
                        primary_forest: 7,
                        peat: 8,
                        protected_areas: 9,
                        plantations: 10,
                        other: 11
                    });
                    jsonMessage.data.should.have.property('alerts').and.have.length(6).and.deep.equal([
                        { alert_type: 'GLAD', date: '10/10/2019 00:10 UTC' },
                        { alert_type: 'GLAD', date: '11/10/2019 00:10 UTC' },
                        { alert_type: 'GLAD', date: '12/10/2019 00:10 UTC' },
                        { alert_type: 'GLAD', date: '13/10/2019 00:10 UTC' },
                        { alert_type: 'GLAD', date: '14/10/2019 00:10 UTC' },
                        { alert_type: 'GLAD', date: '15/10/2019 00:10 UTC' },
                    ]);

                    // Not included in this email version
                    // jsonMessage.data.should.have.property('glad_image_url').and.equal('');
                    // jsonMessage.data.should.have.property('glad_chart_url').and.equal('');
                    // viirs_count : number of VIIRS alerts, e.g. 13,
                    // viirs_days_count : number of days the alert covers, e.g. 2 (context: There were 13 VIIRS fire alerts
                    // reported in the past {2} days)
                    // viirs_day_start : day in which the alert begins to count ? e.g. "9/12/2019"
                    // viirs_day_end : day in which the alert finishes counting e.g. "9/14/2019"
                    // viirs_frequency : frequency of the alerts, like "low", "unusually high", etc.
                    // viirs_image_url : satellite image of the VIIRS alerts,
                    // viirs_chart_url : image of the chart we usually see in the dashboard
                    // viirs_alerts : object with the data for the bubbles (number of alerts). This variable, like the priority
                    // areas and GLADS, is an object. e.g.: { "low": 1, "medium": 1, "high": 0, "intact_forest": 1, "primary_forest": 1,
                    // "peat": 0, "protected_areas": 12 }

                    // Keeping this for backwards compatibility
                    jsonMessage.data.should.have.property('alert_count').and.equal(51);
                    jsonMessage.data.should.have.property('alert_date_begin').and.equal(moment(beginDate).format('YYYY-MM-DD'));
                    jsonMessage.data.should.have.property('alert_date_end').and.equal(moment(endDate).format('YYYY-MM-DD'));
                    jsonMessage.data.should.have.property('alert_link').and.equal(`http://staging.globalforestwatch.org/map/3/0/0/ALL/grayscale/umd_as_it_happens?begin=${moment(beginDate).format('YYYY-MM-DD')}&end=${moment(endDate).format('YYYY-MM-DD')}&fit_to_geom=true&geostore=423e5dfb0448e692f97b590c61f45f22`);
                    jsonMessage.data.should.have.property('alert_name').and.equal(subscriptionOne.name);
                    jsonMessage.data.should.have.property('layerSlug').and.equal('glad-alerts');
                    jsonMessage.data.should.have.property('selected_area').and.equal('Custom Area');
                    jsonMessage.data.should.have.property('subscriptions_url').and.equal('http://staging.globalforestwatch.org/my_gfw/subscriptions');
                    jsonMessage.data.should.have.property('unsubscribe_url').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/subscriptions/${subscriptionOne.id}/unsubscribe?redirect=true`);
                    jsonMessage.data.should.have.property('value').and.equal(5);
                    break;
                case 'subscriptions-stats':
                    jsonMessage.should.have.property('sender').and.equal('gfw');
                    jsonMessage.should.have.property('data').and.be.a('object');
                    jsonMessage.data.should.have.property('counter').and.equal(1);
                    jsonMessage.data.should.have.property('dataset').and.equal('viirs-active-fires');
                    jsonMessage.data.should.have.property('users').and.be.an('array').and.length(1);
                    jsonMessage.data.users[0].should.have.property('userId').and.equal(subscriptionOne.userId);
                    jsonMessage.data.users[0].should.have.property('subscriptionId').and.equal(subscriptionOne.id);
                    jsonMessage.data.users[0].should.have.property('email').and.equal(subscriptionOne.resource.content);
                    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
                    jsonMessage.recipients[0].should.be.an('object').and.have.property('address').and.have.property('email').and.equal('info@vizzuality.com');
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
        redisClient.removeAllListeners('message');
        process.removeAllListeners('unhandledRejection');

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
        await Statistic.deleteMany({}).exec();
    });
});
