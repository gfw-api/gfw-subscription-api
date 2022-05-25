import chai from 'chai';
import nock from 'nock';
import { createClient, RedisClientType } from 'redis';
import config from 'config';
import moment from 'moment';
import cronLoader from '../../src/cronLoader';
import taskConfig from '../../config/cron';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

chai.should();
chai.use(require('chai-datetime'));

const CHANNEL: string = config.get('apiGateway.subscriptionAlertsChannelName');

let redisClient: RedisClientType;

describe('CronLoader task queueing', () => {

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

    it('Test viirs-active-fires cron task queues the expected message', async () => {
        const task = taskConfig.find((e) => e.dataset === 'viirs-active-fires');

        let expectedMessageCount = 1;

        const validateMessage = (resolve: () => void) => async (message: string) => {

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
            redisClient.subscribe(CHANNEL, validateMessage(resolve));
            cronLoader.getTask(task);
        });
    });

    it('Test dataset cron task queues the expected message', async () => {
        const task = taskConfig.find((e) => e.dataset === 'dataset');

        let expectedMessageCount = 1;

        const validateMessage = (resolve: () => void) => async (message: string) => {
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
            redisClient.subscribe(CHANNEL, validateMessage(resolve));
            cronLoader.getTask(task);
        });
    });

    it('Test glad-alerts cron task queues the expected message', async () => {
        const task = taskConfig.find((e) => e.dataset === 'glad-alerts');

        let expectedMessageCount = 1;

        const validateMessage = (resolve: () => void) => async (message: string) => {
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
            redisClient.subscribe(CHANNEL, validateMessage(resolve));
            cronLoader.getTask(task);
        });
    });

    it('Test monthly-summary cron task queues the expected message', async () => {
        const task = taskConfig.find((e) => e.dataset === 'monthly-summary');

        let expectedMessageCount = 1;

        const validateMessage = (resolve: () => void) => async (message: string) => {
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
            redisClient.subscribe(CHANNEL, validateMessage(resolve));
            cronLoader.getTask(task);
        });
    });

    afterEach(async () => {
        await redisClient.unsubscribe(CHANNEL);

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });

});
