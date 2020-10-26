const chai = require('chai');
const nock = require('nock');
const redis = require('redis');
const config = require('config');
const moment = require('moment');
const LastUpdateModel = require('models/lastUpdate');
const { getTestServer } = require('./utils/test-server');
const cronLoader = require('../../src/cronLoader');
const taskConfig = require('../../../config/cron.json');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

chai.should();
chai.use(require('chai-datetime'));

const CHANNEL = config.get('apiGateway.subscriptionAlertsChannelName');

const redisClient = redis.createClient({ url: config.get('redis.url') });
redisClient.subscribe(CHANNEL);

describe('CronLoader task queueing', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }
        if (config.get('settings.loadCron') && config.get('settings.loadCron') !== 'false') {
            throw Error(`Running the test suite with cron enabled is not supported. You can disable cron by setting the LOAD_CRON env variable to false.`);
        }

        // Needed to set config values for the CT integration lib
        await getTestServer();
    });

    beforeEach(async () => {
        await LastUpdateModel.deleteMany({}).exec();

        redisClient.removeAllListeners('message');
    });

    it('Test viirs-active-fires cron task queues the expected message', async () => {
        const task = taskConfig.find((e) => e.dataset === 'viirs-active-fires');
        await cronLoader.getTask(task);

        let expectedMessageCount = 1;

        const validateMessage = (resolve) => async (channel, message) => {

            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('layer_slug').and.equal('viirs-active-fires');

            jsonMessage.should.have.property('begin_date');
            jsonMessage.should.have.property('end_date');
            moment(jsonMessage.begin_date).toDate().should.beforeDate(moment(jsonMessage.end_date).toDate());

            expectedMessageCount -= 1;

            if (expectedMessageCount < 0) {
                throw new Error(`Unexpected message count - expectedMessageCount:${expectedMessageCount}`);
            }

            if (expectedMessageCount === 0) {
                resolve();
            }
        };

        return new Promise((resolve) => {
            redisClient.on('message', validateMessage(resolve));
        });
    });

    it('Test dataset cron task queues the expected message', async () => {
        await new LastUpdateModel({ dataset: 'dataset', date: '2010-01-01' }).save();

        const task = taskConfig.find((e) => e.dataset === 'dataset');
        await cronLoader.getTask(task);

        let expectedMessageCount = 1;

        const validateMessage = (resolve) => async (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('layer_slug').and.equal('dataset');

            expectedMessageCount -= 1;

            if (expectedMessageCount < 0) {
                throw new Error(`Unexpected message count - expectedMessageCount:${expectedMessageCount}`);
            }

            if (expectedMessageCount === 0) {
                resolve();
            }
        };

        return new Promise((resolve) => {
            redisClient.on('message', validateMessage(resolve));
        });
    });

    it('Test glad-alerts cron task queues the expected message', async () => {
        const task = taskConfig.find((e) => e.dataset === 'glad-alerts');
        await cronLoader.getTask(task);

        let expectedMessageCount = 1;

        const validateMessage = (resolve) => async (channel, message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('layer_slug').and.equal('glad-alerts');

            jsonMessage.should.have.property('begin_date');
            jsonMessage.should.have.property('end_date');
            moment(jsonMessage.begin_date).toDate().should.beforeDate(moment(jsonMessage.end_date).toDate());

            expectedMessageCount -= 1;

            if (expectedMessageCount < 0) {
                throw new Error(`Unexpected message count - expectedMessageCount:${expectedMessageCount}`);
            }

            if (expectedMessageCount === 0) {
                resolve();
            }
        };

        return new Promise((resolve) => {
            redisClient.on('message', validateMessage(resolve));
        });
    });

    it('Test monthly-summary cron task queues the expected message', async () => {
        const task = taskConfig.find((e) => e.dataset === 'monthly-summary');
        await cronLoader.getTask(task);

        let expectedMessageCount = 1;

        const validateMessage = (resolve) => async (channel, message) => {
            const jsonMessage = JSON.parse(message);
            jsonMessage.should.have.property('layer_slug').and.equal('monthly-summary');

            jsonMessage.should.have.property('begin_date');
            jsonMessage.should.have.property('end_date');
            moment(jsonMessage.begin_date).toDate().should.beforeDate(moment(jsonMessage.end_date).toDate());

            expectedMessageCount -= 1;

            if (expectedMessageCount < 0) {
                throw new Error(`Unexpected message count - expectedMessageCount:${expectedMessageCount}`);
            }

            if (expectedMessageCount === 0) {
                resolve();
            }
        };

        return new Promise((resolve) => {
            redisClient.on('message', validateMessage(resolve));
        });
    });

    afterEach(async () => {
        redisClient.removeAllListeners('message');

        await LastUpdateModel.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });

});
