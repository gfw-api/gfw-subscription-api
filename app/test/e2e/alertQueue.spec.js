const chai = require('chai');
const nock = require('nock');
const config = require('config');
const co = require('co');
const { getTestServer } = require('./test-server');
const taskConfig = require('../../../config/cron.json');
const moment = require('moment');
const Subscription = require('models/subscription');
const { createSubscription } = require('./utils');
const { ROLES } = require('./test.constants');
const AlertQueue = require('../../src/queues/alertQueue');
nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();
chai.use(require('chai-datetime'));

let requester;

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

    it('Test viirs-active-fires message received', async () => {

        await new Subscription(createSubscription(ROLES.USER.id, 'viirs-active-fires')).save();
        await new Subscription(createSubscription(ROLES.USER.id, 'viirs-active-fires')).save();

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
            .reply(200, {
                "data": {
                    "type": "viirs-active-fires",
                    "id": "undefined",
                    "attributes": {
                        "value": 0,
                        "period": "Past 24 hours",
                        "downloadUrls": {},
                        "areaHa": 2277.27801030436
                    }
                }
            });

        await co(AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'viirs-active-fires',
            begin_date: beginDate,
            end_date: endDate
        })));

        process.on('unhandledRejection', (error) => {
            should.fail(error);
        });
    });


    afterEach(() => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });

    after(() => {
        Subscription.remove({}).exec();
    });
});
