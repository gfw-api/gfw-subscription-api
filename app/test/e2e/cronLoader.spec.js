const chai = require('chai');
const nock = require('nock');
const AsyncClient = require('vizz.async-client');
const config = require('config');
const { getTestServer } = require('./test-server');
const cronLoader = require('../../src/cronLoader');
const taskConfig = require('../../../config/cron.json');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();
chai.use(require('chai-datetime'));

let requester;

const asyncClientSubscriber = new AsyncClient(AsyncClient.REDIS, {
    url: `redis://${config.get('redisLocal.host')}:${config.get('redisLocal.port')}`
});
const CHANNEL = 'subscription_alerts';
const channelSubscribe = asyncClientSubscriber.toChannel(CHANNEL);
channelSubscribe.subscribe();


describe('CronLoader task queueing', () => {

    before(() => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }
    });

    beforeEach(() => {
        channelSubscribe.client.removeAllListeners('message');
    });

    it('Test viirs-active-fires', async () => {
        channelSubscribe.on('message', function* (channel, message) {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('layer_slug').and.equal('viirs-active-fires');

            jsonMessage.should.have.property('begin_date');
            new Date(jsonMessage.begin_date).should.beforeDate(new Date());

            jsonMessage.should.have.property('end_date');
            new Date(jsonMessage.end_date).should.equalDate(new Date());
        });

        const task = taskConfig.find(e => e.dataset === 'viirs-active-fires');
        cronLoader.getTask(task);

        process.on('unhandledRejection', (error) => {
            should.fail(error);
        });
    });

    it('Test imazon-alerts', async () => {
        requester = await getTestServer();

        nock(process.env.CT_URL)
            .get('/v1/imazon-alerts/latest')
            .reply(200, {
                data: [
                    {
                        type: "imazon-latest",
                        id: "undefined",
                        attributes: {
                            "date": "2018-12-31T00:00:00Z"
                        }
                    },
                    {
                        type: "imazon-latest",
                        id: "undefined",
                        attributes: {
                            date: "2018-11-30T00:00:00Z"
                        }
                    },
                    {
                        type: "imazon-latest",
                        id: "undefined",
                        attributes: {
                            date: "2018-10-31T00:00:00Z"
                        }
                    }
                ]
            });

        channelSubscribe.on('message', function* (channel, message) {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('layer_slug').and.equal('imazon-alerts');

            jsonMessage.should.have.property('begin_date');
            new Date(jsonMessage.begin_date).should.beforeDate(new Date());

            jsonMessage.should.have.property('end_date');
            new Date(jsonMessage.end_date).should.equalDate(new Date());

            new Date(jsonMessage.begin_date).should.beforeDate(new Date(jsonMessage.end_date));
        });

        const task = taskConfig.find(e => e.dataset === 'imazon-alerts');
        cronLoader.getTask(task);

        process.on('unhandledRejection', (error) => {
            should.fail(error);
        });
    });

    it('Test story', async () => {
        channelSubscribe.on('message', function* (channel, message) {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('layer_slug').and.equal('story');

            jsonMessage.should.have.property('begin_date');
            new Date(jsonMessage.begin_date).should.beforeDate(new Date());

            jsonMessage.should.have.property('end_date');
            new Date(jsonMessage.end_date).should.equalDate(new Date());

            new Date(jsonMessage.begin_date).should.beforeDate(new Date(jsonMessage.end_date));
        });

        const task = taskConfig.find(e => e.dataset === 'story');
        cronLoader.getTask(task);

        process.on('unhandledRejection', (error) => {
            should.fail(error);
        });
    });

    it('Test forma-alerts', async () => {
        channelSubscribe.on('message', function* (channel, message) {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('layer_slug').and.equal('forma-alerts');

            jsonMessage.should.have.property('begin_date');
            new Date(jsonMessage.begin_date).should.beforeDate(new Date());

            jsonMessage.should.have.property('end_date');
            new Date(jsonMessage.end_date).should.beforeDate(new Date());

            new Date(jsonMessage.begin_date).should.beforeDate(new Date(jsonMessage.end_date));
        });

        const task = taskConfig.find(e => e.dataset === 'forma-alerts');
        cronLoader.getTask(task);

        process.on('unhandledRejection', (error) => {
            should.fail(error);
        });
    });

    it('Test dataset', async () => {
        channelSubscribe.on('message', function* (channel, message) {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('layer_slug').and.equal('dataset');
        });

        const task = taskConfig.find(e => e.dataset === 'dataset');
        cronLoader.getTask(task);

        process.on('unhandledRejection', (error) => {
            should.fail(error);
        });
    });

    it('Test forma250GFW', async () => {
        channelSubscribe.on('message', function* (channel, message) {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('layer_slug').and.equal('forma250GFW');

            jsonMessage.should.have.property('begin_date');
            new Date(jsonMessage.begin_date).should.beforeDate(new Date());

            jsonMessage.should.have.property('end_date');
            new Date(jsonMessage.end_date).should.beforeDate(new Date());

            new Date(jsonMessage.begin_date).should.beforeDate(new Date(jsonMessage.end_date));
        });

        const task = taskConfig.find(e => e.dataset === 'forma250GFW');
        cronLoader.getTask(task);

        process.on('unhandledRejection', (error) => {
            should.fail(error);
        });
    });

    afterEach(() => {
        channelSubscribe.client.removeAllListeners('message');

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });

});
