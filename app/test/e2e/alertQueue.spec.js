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


describe('AlertQueue ', () => {

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


    afterEach(() => {
        channelSubscribe.client.removeAllListeners('message');

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });

});
