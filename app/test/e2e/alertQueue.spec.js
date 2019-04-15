const chai = require('chai');
const nock = require('nock');
const config = require('config');
const co = require('co');
const { getTestServer } = require('./test-server');
const taskConfig = require('../../../config/cron.json');
const moment = require('moment');
const Subscription = require('models/subscription');
const fs = require('fs');
const path = require('path');
const AsyncClient = require('vizz.async-client');

const { createSubscription } = require('./utils');
const { ROLES } = require('./test.constants');

const AlertQueue = require('../../src/queues/alertQueue');
nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();
chai.use(require('chai-datetime'));

let requester;

const asyncClientSubscriber = new AsyncClient(AsyncClient.REDIS, {
    url: `redis://${config.get('redisLocal.host')}:${config.get('redisLocal.port')}`
});
const CHANNEL = config.get('apiGateway.queueName');
const channelSubscribe = asyncClientSubscriber.toChannel(CHANNEL);
channelSubscribe.subscribe();

describe('AlertQueue ', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }
        if (config.get('settings.loadCron') && config.get('settings.loadCron') !== 'false') {
            throw Error(`Running the test suite with cron enabled is not supported. You can disable cron by setting the LOAD_CRON env variable to false.`);
        }

        requester = await getTestServer();

        Subscription.remove({}).exec();
    });

    it('Test viirs-active-fires message received with actual data triggers emails being queued', async () => {

        const subscriptionOne = await new Subscription(createSubscription(ROLES.USER.id, 'viirs-active-fires')).save();
        const subscriptionTwo = await new Subscription(createSubscription(ROLES.USER.id, 'viirs-active-fires')).save();

        const task = taskConfig.find(e => e.dataset === 'viirs-active-fires');

        let beginDate = moment().subtract(task.gap.value, task.gap.measure).subtract(task.periodicity.value, task.periodicity.measure).toDate();
        let endDate = moment().subtract(task.gap.value, task.gap.measure).toDate();

        nock(process.env.CT_URL)
            .get('/v1/viirs-active-fires/')
            .query(
                (params) => {
                    const expected =
                        {
                            period: moment(beginDate).format('YYYY-MM-DD') + ',' + moment(endDate).format('YYYY-MM-DD'),
                            geostore: 'agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw'
                        }

                    params.should.have.property('period').and.equal(expected.period);
                    params.should.have.property('geostore').and.equal(expected.geostore);

                    return true;
                }
            )
            .twice()
            .reply(200, JSON.parse(fs.readFileSync(path.join(__dirname, 'resources', 'viirs-active-fires-response.json'))));

        process.on('unhandledRejection', (error) => {
            should.fail(error);
        });

        channelSubscribe.on('message', function* (channel, message) {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');


            switch (jsonMessage.template) {
                case 'fires-notification-en':
                    jsonMessage.should.have.property('sender').and.equal('gfw');
                    jsonMessage.should.have.property('data').and.be.a('object');


                    jsonMessage.data.should.have.property('value').and.equal(3578);
                    jsonMessage.data.should.have.property('alert_count').and.equal(3578);
                    jsonMessage.data.should.have.property('map_image').and.equal(null);
                    jsonMessage.data.should.have.property('layerSlug').and.equal('viirs-active-fires');
                    jsonMessage.data.should.have.property('alert_name').and.be.oneOf([subscriptionOne.name, subscriptionTwo.name]);
                    jsonMessage.data.should.have.property('selected_area').and.equal('Custom Area');
                    jsonMessage.data.should.have.property('unsubscribe_url').and.be.oneOf([`http://${process.env.HOST_IP}:9000/subscriptions/${subscriptionOne.id}/unsubscribe?redirect=true`, `http://${process.env.HOST_IP}:9000/subscriptions/${subscriptionTwo.id}/unsubscribe?redirect=true`]);
                    jsonMessage.data.should.have.property('subscriptions_url').and.equal('http://staging.globalforestwatch.org/my_gfw/subscriptions');
                    jsonMessage.data.should.have.property('alert_link').and.equal(`http://staging.globalforestwatch.org/map/3/0/0/ALL/grayscale/viirs_fires_alerts?begin=${moment(beginDate).format('YYYY-MM-DD')}&end=${moment(endDate).format('YYYY-MM-DD')}&fit_to_geom=true&geostore=agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw`);
                    jsonMessage.data.should.have.property('alert_date_begin').and.equal(moment(beginDate).format('YYYY-MM-DD'));
                    jsonMessage.data.should.have.property('alert_date_end').and.equal(moment(endDate).format('YYYY-MM-DD'));

                    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
                    jsonMessage.recipients[0].should.be.an('object').and.have.property('address').and.have.property('email').and.equal('subscription-receipient@vizzuality.com');
                    break;
                case 'subscriptions-stats':
                    jsonMessage.should.have.property('sender').and.equal('gfw');
                    jsonMessage.should.have.property('data').and.be.a('object');

                    jsonMessage.data.should.have.property('counter').and.equal(1);
                    jsonMessage.data.should.have.property('dataset').and.equal('viirs-active-fires');
                    jsonMessage.data.should.have.property('users').and.be.an('array').and.length(1);

                    jsonMessage.data.users[0].should.have.property('userId').and.be.oneOf([subscriptionOne.userId, subscriptionTwo.userId]);
                    jsonMessage.data.users[0].should.have.property('subscriptionId').and.be.oneOf([subscriptionOne.id, subscriptionTwo.id]);

                    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
                    jsonMessage.recipients[0].should.be.an('object').and.have.property('address').and.have.property('email').and.equal('info@vizzuality.com');
                    break;
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;
            }
        });

        await co(AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'viirs-active-fires',
            begin_date: beginDate,
            end_date: endDate
        })));
    });


    afterEach(() => {
        channelSubscribe.client.removeAllListeners('message');

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });

    after(() => {
        Subscription.remove({}).exec();
    });
});
