/* eslint-disable max-len */

const chai = require('chai');
const nock = require('nock');
const config = require('config');
const moment = require('moment');
const Subscription = require('models/subscription');
const Statistic = require('models/statistic');
const redis = require('redis');
const { getTestServer } = require('./utils/test-server');

const { createSubscription } = require('./utils/helpers');
const { createMockAlertsQuery, createMockGLADAlertsForCustomRegion, createMockGLADAlertsQuery } = require('./utils/mock');
const { ROLES } = require('./utils/test.constants');

const AlertQueue = require('../../src/queues/alert.queue');
const GLADPresenter = require('../../src/presenters/gladPresenter');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();
chai.use(require('chai-datetime'));

const CHANNEL = config.get('apiGateway.queueName');
const redisClient = redis.createClient({ url: config.get('redis.url') });
redisClient.subscribe(CHANNEL);

const assertSubscriptionStats = (jsonMessage, sub) => {
    jsonMessage.should.have.property('sender').and.equal('gfw');
    jsonMessage.should.have.property('data').and.be.a('object');
    jsonMessage.data.should.have.property('counter').and.equal(1);
    jsonMessage.data.should.have.property('dataset').and.equal('viirs-active-fires');
    jsonMessage.data.should.have.property('users').and.be.an('array').and.length(1);
    jsonMessage.data.users[0].should.have.property('userId').and.equal(sub.userId);
    jsonMessage.data.users[0].should.have.property('subscriptionId').and.equal(sub.id);
    jsonMessage.data.users[0].should.have.property('email').and.equal(sub.resource.content);
    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
    jsonMessage.recipients[0].should.be.an('object').and.have.property('address').and.have.property('email').and.equal('info@vizzuality.com');
};

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
        const sql = `SELECT * FROM data WHERE alert__date > '${beginDate.format('YYYY-MM-DD')}' AND alert__date <= '${endDate.format('YYYY-MM-DD')}' AND geostore__id = '${subscriptionOne.params.geostore}' ORDER BY alert__date`;
        createMockGLADAlertsQuery(beginDate, endDate);
        createMockAlertsQuery(config.get('datasets.gladAlertsDataset'), 2);

        process.on('unhandledRejection', (error) => should.fail(error));

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'forest-change-notification-glads-en':
                    jsonMessage.should.have.property('sender').and.equal('gfw');
                    jsonMessage.should.have.property('data').and.be.a('object');

                    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
                    jsonMessage.recipients[0].should.be.an('object')
                        .and.have.property('address')
                        .and.have.property('email')
                        .and.equal('subscription-recipient@vizzuality.com');
                    jsonMessage.data.should.have.property('glad_frequency').and.equal('average');
                    jsonMessage.data.should.have.property('month').and.equal(beginDate.format('MMMM'));
                    jsonMessage.data.should.have.property('year').and.equal(beginDate.format('YYYY'));
                    jsonMessage.data.should.have.property('week_of').and.equal(`${beginDate.format('DD MMM')}`);
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

                    // Keeping this for backwards compatibility
                    jsonMessage.data.should.have.property('alert_count').and.equal(51);
                    jsonMessage.data.should.have.property('alert_date_begin').and.equal(moment(beginDate).format('YYYY-MM-DD'));
                    jsonMessage.data.should.have.property('alert_date_end').and.equal(moment(endDate).format('YYYY-MM-DD'));
                    jsonMessage.data.should.have.property('alert_link').and.equal(`http://staging.globalforestwatch.org/map/3/0/0/ALL/grayscale/umd_as_it_happens?begin=${moment(beginDate).format('YYYY-MM-DD')}&end=${moment(endDate).format('YYYY-MM-DD')}&fit_to_geom=true&geostore=423e5dfb0448e692f97b590c61f45f22&lang=en`);
                    jsonMessage.data.should.have.property('alert_name').and.equal(subscriptionOne.name);
                    jsonMessage.data.should.have.property('layerSlug').and.equal('glad-alerts');
                    jsonMessage.data.should.have.property('selected_area').and.equal('Custom Area');
                    jsonMessage.data.should.have.property('subscriptions_url').and.equal('http://staging.globalforestwatch.org/my-gfw?lang=en');
                    jsonMessage.data.should.have.property('unsubscribe_url').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/subscriptions/${subscriptionOne.id}/unsubscribe?redirect=true&lang=en`);
                    jsonMessage.data.should.have.property('download_csv').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/download/${config.get('datasets.gladAlertsDataset')}?sql=${sql}&format=csv`);
                    jsonMessage.data.should.have.property('download_json').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/download/${config.get('datasets.gladAlertsDataset')}?sql=${sql}&format=json`);
                    jsonMessage.data.should.have.property('value').and.equal(5);
                    break;
                case 'subscriptions-stats':
                    assertSubscriptionStats(jsonMessage, subscriptionOne);
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
        GLADPresenter.updateMonthTranslations();
        moment.locale('fr');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' }, language: 'fr' },
        )).save();

        const beginDate = moment().subtract('1', 'w');
        const endDate = moment();
        const sql = `SELECT * FROM data WHERE alert__date > '${beginDate.format('YYYY-MM-DD')}' AND alert__date <= '${endDate.format('YYYY-MM-DD')}' AND geostore__id = '${subscriptionOne.params.geostore}' ORDER BY alert__date`;
        createMockGLADAlertsQuery(beginDate, endDate);
        createMockAlertsQuery(config.get('datasets.gladAlertsDataset'), 2);

        process.on('unhandledRejection', (error) => should.fail(error));

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'forest-change-notification-glads-fr':
                    jsonMessage.should.have.property('sender').and.equal('gfw');
                    jsonMessage.should.have.property('data').and.be.a('object');

                    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
                    jsonMessage.recipients[0].should.be.an('object')
                        .and.have.property('address')
                        .and.have.property('email')
                        .and.equal('subscription-recipient@vizzuality.com');
                    jsonMessage.data.should.have.property('glad_frequency').and.equal('moyenne');
                    jsonMessage.data.should.have.property('month').and.equal(beginDate.format('MMMM'));
                    jsonMessage.data.should.have.property('year').and.equal(beginDate.format('YYYY'));
                    jsonMessage.data.should.have.property('week_of').and.equal(`${beginDate.format('DD MMM')}`);
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

                    // Keeping this for backwards compatibility
                    jsonMessage.data.should.have.property('alert_count').and.equal(51);
                    jsonMessage.data.should.have.property('alert_date_begin').and.equal(moment(beginDate).format('YYYY-MM-DD'));
                    jsonMessage.data.should.have.property('alert_date_end').and.equal(moment(endDate).format('YYYY-MM-DD'));
                    jsonMessage.data.should.have.property('alert_link').and.equal(`http://staging.globalforestwatch.org/map/3/0/0/ALL/grayscale/umd_as_it_happens?begin=${moment(beginDate).format('YYYY-MM-DD')}&end=${moment(endDate).format('YYYY-MM-DD')}&fit_to_geom=true&geostore=423e5dfb0448e692f97b590c61f45f22&lang=fr`);
                    jsonMessage.data.should.have.property('alert_name').and.equal(subscriptionOne.name);
                    jsonMessage.data.should.have.property('layerSlug').and.equal('glad-alerts');
                    jsonMessage.data.should.have.property('selected_area').and.equal('Custom Area');
                    jsonMessage.data.should.have.property('subscriptions_url').and.equal(`http://staging.globalforestwatch.org/my-gfw?lang=fr`);
                    jsonMessage.data.should.have.property('unsubscribe_url').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/subscriptions/${subscriptionOne.id}/unsubscribe?redirect=true&lang=fr`);
                    jsonMessage.data.should.have.property('download_csv').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/download/${config.get('datasets.gladAlertsDataset')}?sql=${sql}&format=csv`);
                    jsonMessage.data.should.have.property('download_json').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/download/${config.get('datasets.gladAlertsDataset')}?sql=${sql}&format=json`);
                    jsonMessage.data.should.have.property('value').and.equal(5);
                    break;
                case 'subscriptions-stats':
                    assertSubscriptionStats(jsonMessage, subscriptionOne);
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
        GLADPresenter.updateMonthTranslations();
        moment.locale('zh');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { geostore: '423e5dfb0448e692f97b590c61f45f22' }, language: 'zh' },
        )).save();

        const beginDate = moment().subtract('1', 'w');
        const endDate = moment();
        const sql = `SELECT * FROM data WHERE alert__date > '${beginDate.format('YYYY-MM-DD')}' AND alert__date <= '${endDate.format('YYYY-MM-DD')}' AND geostore__id = '${subscriptionOne.params.geostore}' ORDER BY alert__date`;
        createMockGLADAlertsQuery(beginDate, endDate);
        createMockAlertsQuery(config.get('datasets.gladAlertsDataset'), 2);

        process.on('unhandledRejection', (error) => should.fail(error));

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'forest-change-notification-glads-zh':
                    jsonMessage.should.have.property('sender').and.equal('gfw');
                    jsonMessage.should.have.property('data').and.be.a('object');
                    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
                    jsonMessage.recipients[0].should.be.an('object')
                        .and.have.property('address')
                        .and.have.property('email')
                        .and.equal('subscription-recipient@vizzuality.com');
                    jsonMessage.data.should.have.property('glad_frequency').and.equal('平均');
                    jsonMessage.data.should.have.property('month').and.equal(beginDate.format('MMMM'));
                    jsonMessage.data.should.have.property('year').and.equal(beginDate.format('YYYY'));
                    jsonMessage.data.should.have.property('week_of').and.equal(`${beginDate.format('DD MMM')}`);
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

                    // Keeping this for backwards compatibility
                    jsonMessage.data.should.have.property('alert_count').and.equal(51);
                    jsonMessage.data.should.have.property('alert_date_begin').and.equal(moment(beginDate).format('YYYY-MM-DD'));
                    jsonMessage.data.should.have.property('alert_date_end').and.equal(moment(endDate).format('YYYY-MM-DD'));
                    jsonMessage.data.should.have.property('alert_link').and.equal(`http://staging.globalforestwatch.org/map/3/0/0/ALL/grayscale/umd_as_it_happens?begin=${moment(beginDate).format('YYYY-MM-DD')}&end=${moment(endDate).format('YYYY-MM-DD')}&fit_to_geom=true&geostore=423e5dfb0448e692f97b590c61f45f22&lang=zh`);
                    jsonMessage.data.should.have.property('alert_name').and.equal(subscriptionOne.name);
                    jsonMessage.data.should.have.property('layerSlug').and.equal('glad-alerts');
                    jsonMessage.data.should.have.property('selected_area').and.equal('Custom Area');
                    jsonMessage.data.should.have.property('subscriptions_url').and.equal('http://staging.globalforestwatch.org/my-gfw?lang=zh');
                    jsonMessage.data.should.have.property('unsubscribe_url').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/subscriptions/${subscriptionOne.id}/unsubscribe?redirect=true&lang=zh`);
                    jsonMessage.data.should.have.property('download_csv').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/download/${config.get('datasets.gladAlertsDataset')}?sql=${sql}&format=csv`);
                    jsonMessage.data.should.have.property('download_json').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/download/${config.get('datasets.gladAlertsDataset')}?sql=${sql}&format=json`);
                    jsonMessage.data.should.have.property('value').and.equal(5);
                    break;
                case 'subscriptions-stats':
                    assertSubscriptionStats(jsonMessage, subscriptionOne);
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
        GLADPresenter.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { iso: { country: 'IDN' } } },
        )).save();

        const beginDate = moment().subtract('1', 'w');
        const endDate = moment();
        const sql = `SELECT * FROM data WHERE alert__date > '${beginDate.format('YYYY-MM-DD')}' AND alert__date <= '${endDate.format('YYYY-MM-DD')}' AND geostore__id = '${subscriptionOne.params.geostore}' ORDER BY alert__date`;
        createMockAlertsQuery(config.get('datasets.gladAlertsDataset'), 2);
        createMockGLADAlertsForCustomRegion(
            'admin/IDN',
            { period: `${beginDate.format('YYYY-MM-DD')},${endDate.format('YYYY-MM-DD')}` },
        );

        process.on('unhandledRejection', (error) => should.fail(error));

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'forest-change-notification-glads-en':
                    jsonMessage.should.have.property('sender').and.equal('gfw');
                    jsonMessage.should.have.property('data').and.be.a('object');
                    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
                    jsonMessage.recipients[0].should.be.an('object')
                        .and.have.property('address')
                        .and.have.property('email')
                        .and.equal('subscription-recipient@vizzuality.com');
                    jsonMessage.data.should.have.property('glad_frequency').and.equal('average');
                    jsonMessage.data.should.have.property('month').and.equal(beginDate.format('MMMM'));
                    jsonMessage.data.should.have.property('year').and.equal(beginDate.format('YYYY'));
                    jsonMessage.data.should.have.property('week_of').and.equal(`${beginDate.format('DD MMM')}`);
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

                    // Keeping this for backwards compatibility
                    jsonMessage.data.should.have.property('alert_count').and.equal(51);
                    jsonMessage.data.should.have.property('alert_date_begin').and.equal(moment(beginDate).format('YYYY-MM-DD'));
                    jsonMessage.data.should.have.property('alert_date_end').and.equal(moment(endDate).format('YYYY-MM-DD'));
                    jsonMessage.data.should.have.property('alert_link').and.equal(`http://staging.globalforestwatch.org/map/3/0/0/IDN/grayscale/umd_as_it_happens?begin=${moment(beginDate).format('YYYY-MM-DD')}&end=${moment(endDate).format('YYYY-MM-DD')}&fit_to_geom=true&lang=en`);
                    jsonMessage.data.should.have.property('alert_name').and.equal(subscriptionOne.name);
                    jsonMessage.data.should.have.property('layerSlug').and.equal('glad-alerts');
                    jsonMessage.data.should.have.property('selected_area').and.equal('ISO Code: IDN');
                    jsonMessage.data.should.have.property('subscriptions_url').and.equal('http://staging.globalforestwatch.org/my-gfw?lang=en');
                    jsonMessage.data.should.have.property('unsubscribe_url').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/subscriptions/${subscriptionOne.id}/unsubscribe?redirect=true&lang=en`);
                    jsonMessage.data.should.have.property('download_csv').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/download/${config.get('datasets.gladAlertsDataset')}?sql=${sql}&format=csv`);
                    jsonMessage.data.should.have.property('download_json').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/download/${config.get('datasets.gladAlertsDataset')}?sql=${sql}&format=json`);
                    jsonMessage.data.should.have.property('value').and.equal(78746908);
                    break;
                case 'subscriptions-stats':
                    assertSubscriptionStats(jsonMessage, subscriptionOne);
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
        GLADPresenter.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { iso: { country: 'IDN', region: '3' } } },
        )).save();

        const beginDate = moment().subtract('1', 'w');
        const endDate = moment();
        const sql = `SELECT * FROM data WHERE alert__date > '${beginDate.format('YYYY-MM-DD')}' AND alert__date <= '${endDate.format('YYYY-MM-DD')}' AND geostore__id = '${subscriptionOne.params.geostore}' ORDER BY alert__date`;
        createMockAlertsQuery(config.get('datasets.gladAlertsDataset'), 2);
        createMockGLADAlertsForCustomRegion(
            'admin/IDN/3',
            { period: `${beginDate.format('YYYY-MM-DD')},${endDate.format('YYYY-MM-DD')}` },
        );

        process.on('unhandledRejection', (error) => should.fail(error));

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'forest-change-notification-glads-en':
                    jsonMessage.should.have.property('sender').and.equal('gfw');
                    jsonMessage.should.have.property('data').and.be.a('object');
                    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
                    jsonMessage.recipients[0].should.be.an('object')
                        .and.have.property('address')
                        .and.have.property('email')
                        .and.equal('subscription-recipient@vizzuality.com');
                    jsonMessage.data.should.have.property('glad_frequency').and.equal('average');
                    jsonMessage.data.should.have.property('month').and.equal(beginDate.format('MMMM'));
                    jsonMessage.data.should.have.property('year').and.equal(beginDate.format('YYYY'));
                    jsonMessage.data.should.have.property('week_of').and.equal(`${beginDate.format('DD MMM')}`);
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

                    // Keeping this for backwards compatibility
                    jsonMessage.data.should.have.property('alert_count').and.equal(51);
                    jsonMessage.data.should.have.property('alert_date_begin').and.equal(moment(beginDate).format('YYYY-MM-DD'));
                    jsonMessage.data.should.have.property('alert_date_end').and.equal(moment(endDate).format('YYYY-MM-DD'));
                    jsonMessage.data.should.have.property('alert_link').and.equal(`http://staging.globalforestwatch.org/map/3/0/0/IDN-3/grayscale/umd_as_it_happens?begin=${moment(beginDate).format('YYYY-MM-DD')}&end=${moment(endDate).format('YYYY-MM-DD')}&fit_to_geom=true&lang=en`);
                    jsonMessage.data.should.have.property('alert_name').and.equal(subscriptionOne.name);
                    jsonMessage.data.should.have.property('layerSlug').and.equal('glad-alerts');
                    jsonMessage.data.should.have.property('selected_area').and.equal('ISO Code: IDN, ID1: 3');
                    jsonMessage.data.should.have.property('subscriptions_url').and.equal('http://staging.globalforestwatch.org/my-gfw?lang=en');
                    jsonMessage.data.should.have.property('unsubscribe_url').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/subscriptions/${subscriptionOne.id}/unsubscribe?redirect=true&lang=en`);
                    jsonMessage.data.should.have.property('download_csv').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/download/${config.get('datasets.gladAlertsDataset')}?sql=${sql}&format=csv`);
                    jsonMessage.data.should.have.property('download_json').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/download/${config.get('datasets.gladAlertsDataset')}?sql=${sql}&format=json`);
                    jsonMessage.data.should.have.property('value').and.equal(78746908);
                    break;
                case 'subscriptions-stats':
                    assertSubscriptionStats(jsonMessage, subscriptionOne);
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
        GLADPresenter.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { wdpaid: '1' } },
        )).save();

        const beginDate = moment().subtract('1', 'w');
        const endDate = moment();
        const sql = `SELECT * FROM data WHERE alert__date > '${beginDate.format('YYYY-MM-DD')}' AND alert__date <= '${endDate.format('YYYY-MM-DD')}' AND geostore__id = '${subscriptionOne.params.geostore}' ORDER BY alert__date`;
        createMockAlertsQuery(config.get('datasets.gladAlertsDataset'), 2);
        createMockGLADAlertsForCustomRegion(
            'wdpa/1',
            { period: `${beginDate.format('YYYY-MM-DD')},${endDate.format('YYYY-MM-DD')}` },
        );

        process.on('unhandledRejection', (error) => should.fail(error));

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'forest-change-notification-glads-en':
                    jsonMessage.should.have.property('sender').and.equal('gfw');
                    jsonMessage.should.have.property('data').and.be.a('object');
                    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
                    jsonMessage.recipients[0].should.be.an('object')
                        .and.have.property('address')
                        .and.have.property('email')
                        .and.equal('subscription-recipient@vizzuality.com');
                    jsonMessage.data.should.have.property('glad_frequency').and.equal('average');
                    jsonMessage.data.should.have.property('month').and.equal(beginDate.format('MMMM'));
                    jsonMessage.data.should.have.property('year').and.equal(beginDate.format('YYYY'));
                    jsonMessage.data.should.have.property('week_of').and.equal(`${beginDate.format('DD MMM')}`);
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

                    // Keeping this for backwards compatibility
                    jsonMessage.data.should.have.property('alert_count').and.equal(51);
                    jsonMessage.data.should.have.property('alert_date_begin').and.equal(moment(beginDate).format('YYYY-MM-DD'));
                    jsonMessage.data.should.have.property('alert_date_end').and.equal(moment(endDate).format('YYYY-MM-DD'));
                    jsonMessage.data.should.have.property('alert_link').and.equal(`http://staging.globalforestwatch.org/map/3/0/0/ALL/grayscale/umd_as_it_happens?begin=${moment(beginDate).format('YYYY-MM-DD')}&end=${moment(endDate).format('YYYY-MM-DD')}&fit_to_geom=true&wdpaid=1&lang=en`);
                    jsonMessage.data.should.have.property('alert_name').and.equal(subscriptionOne.name);
                    jsonMessage.data.should.have.property('layerSlug').and.equal('glad-alerts');
                    jsonMessage.data.should.have.property('selected_area').and.equal('WDPA ID: 1');
                    jsonMessage.data.should.have.property('subscriptions_url').and.equal('http://staging.globalforestwatch.org/my-gfw?lang=en');
                    jsonMessage.data.should.have.property('unsubscribe_url').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/subscriptions/${subscriptionOne.id}/unsubscribe?redirect=true&lang=en`);
                    jsonMessage.data.should.have.property('download_csv').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/download/${config.get('datasets.gladAlertsDataset')}?sql=${sql}&format=csv`);
                    jsonMessage.data.should.have.property('download_json').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/download/${config.get('datasets.gladAlertsDataset')}?sql=${sql}&format=json`);
                    jsonMessage.data.should.have.property('value').and.equal(78746908);
                    break;
                case 'subscriptions-stats':
                    assertSubscriptionStats(jsonMessage, subscriptionOne);
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
        GLADPresenter.updateMonthTranslations();
        moment.locale('en');
        const subscriptionOne = await new Subscription(createSubscription(
            ROLES.USER.id,
            'glad-alerts',
            { params: { use: 'gfw_logging', useid: '29407' } },
        )).save();

        const beginDate = moment().subtract('1', 'w');
        const endDate = moment();
        const sql = `SELECT * FROM data WHERE alert__date > '${beginDate.format('YYYY-MM-DD')}' AND alert__date <= '${endDate.format('YYYY-MM-DD')}' AND geostore__id = '${subscriptionOne.params.geostore}' ORDER BY alert__date`;
        createMockAlertsQuery(config.get('datasets.gladAlertsDataset'), 2);
        createMockGLADAlertsForCustomRegion(
            'use/gfw_logging/29407',
            { period: `${beginDate.format('YYYY-MM-DD')},${endDate.format('YYYY-MM-DD')}` },
        );

        process.on('unhandledRejection', (error) => should.fail(error));

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');

            switch (jsonMessage.template) {

                case 'forest-change-notification-glads-en':
                    jsonMessage.should.have.property('sender').and.equal('gfw');
                    jsonMessage.should.have.property('data').and.be.a('object');
                    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
                    jsonMessage.recipients[0].should.be.an('object')
                        .and.have.property('address')
                        .and.have.property('email')
                        .and.equal('subscription-recipient@vizzuality.com');
                    jsonMessage.data.should.have.property('glad_frequency').and.equal('average');
                    jsonMessage.data.should.have.property('month').and.equal(beginDate.format('MMMM'));
                    jsonMessage.data.should.have.property('year').and.equal(beginDate.format('YYYY'));
                    jsonMessage.data.should.have.property('week_of').and.equal(`${beginDate.format('DD MMM')}`);
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

                    // Keeping this for backwards compatibility
                    jsonMessage.data.should.have.property('alert_count').and.equal(51);
                    jsonMessage.data.should.have.property('alert_date_begin').and.equal(moment(beginDate).format('YYYY-MM-DD'));
                    jsonMessage.data.should.have.property('alert_date_end').and.equal(moment(endDate).format('YYYY-MM-DD'));
                    jsonMessage.data.should.have.property('alert_link').and.equal(`http://staging.globalforestwatch.org/map/3/0/0/ALL/grayscale/umd_as_it_happens?begin=${moment(beginDate).format('YYYY-MM-DD')}&end=${moment(endDate).format('YYYY-MM-DD')}&fit_to_geom=true&use=gfw_logging&useid=29407&lang=en`);
                    jsonMessage.data.should.have.property('alert_name').and.equal(subscriptionOne.name);
                    jsonMessage.data.should.have.property('layerSlug').and.equal('glad-alerts');
                    jsonMessage.data.should.have.property('selected_area').and.equal('Custom Area');
                    jsonMessage.data.should.have.property('subscriptions_url').and.equal('http://staging.globalforestwatch.org/my-gfw?lang=en');
                    jsonMessage.data.should.have.property('unsubscribe_url').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/subscriptions/${subscriptionOne.id}/unsubscribe?redirect=true&lang=en`);
                    jsonMessage.data.should.have.property('download_csv').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/download/${config.get('datasets.gladAlertsDataset')}?sql=${sql}&format=csv`);
                    jsonMessage.data.should.have.property('download_json').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/download/${config.get('datasets.gladAlertsDataset')}?sql=${sql}&format=json`);
                    jsonMessage.data.should.have.property('value').and.equal(78746908);
                    break;
                case 'subscriptions-stats':
                    assertSubscriptionStats(jsonMessage, subscriptionOne);
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
