import chai from 'chai';
import nock from 'nock';
import config from 'config';
import moment from 'moment';
import Subscription from 'models/subscription';
import Statistic from 'models/statistic';
import EmailValidationService from 'services/emailValidationService';
import { createSubscription } from '../utils/helpers';
import { getTestServer } from '../utils/test-server';
import { mockSparkpostMetricsCalls } from '../utils/mocks/sparkpost.mocks';
import { mockSlackCalls } from '../utils/mocks/slack.mocks';
import { ROLES } from '../utils/test.constants';
import { mockGLADLGeostoreQuery } from '../utils/mocks/gladL.mocks';
import { mockVIIRSAlertsGeostoreQuery } from '../utils/mock';

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

chai.should();
chai.use(require('chai-datetime'));


describe('Subscription emails validation cron', () => {
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

    it('Slack notification with no subscription and no emails sent should report all-zeros to slack', async () => {
        mockSparkpostMetricsCalls();
        mockSlackCalls();

        await EmailValidationService.validateSubscriptionEmailCount();
    });

    describe("Monthly summary emails tests", () => {
        it('Slack notification with a monthly subscription and one monthly summary email sent should report emails sent to slack on the first day of the month', async () => {
            await createSubscription(
                ROLES.USER.id,
                {
                    datasets: ['monthly-summary']
                }
            );

            mockGLADLGeostoreQuery();
            mockVIIRSAlertsGeostoreQuery();

            mockSparkpostMetricsCalls({
                "monthly-summary": 1
            });
            mockSlackCalls({
                monthlySummary: {
                    expected: 1,
                    actual: 1
                }
            });

            await EmailValidationService.validateSubscriptionEmailCount(moment().date(1));
        });

        it('Slack notification with a monthly subscription and one monthly summary email sent should report no emails sent to slack on any day other than the first day of the month', async () => {
            await createSubscription(
                ROLES.USER.id,
                {
                    datasets: ['monthly-summary']
                }
            );

            mockSparkpostMetricsCalls({
                "monthly-summary": 0
            });
            mockSlackCalls({
                monthlySummary: {
                    expected: 0,
                    actual: 0
                }
            });

            await EmailValidationService.validateSubscriptionEmailCount(moment().date(3));
        });

    })

    describe("VIIRS emails tests", () => {
        it('Slack notification with a viirs subscription and one viirs email sent should report emails sent to slack', async () => {
            await createSubscription(
                ROLES.USER.id,
                {
                    datasets: ['viirs-active-fires']
                }
            );

            mockVIIRSAlertsGeostoreQuery();

            mockSparkpostMetricsCalls({
                "forest-fires-notification-viirs-es-mx": 1
            });
            mockSlackCalls({
                viirs: {
                    expected: 1,
                    actual: 1
                }
            });

            await EmailValidationService.validateSubscriptionEmailCount(moment().date(1));
        });

        it('Slack notification with multiple viirs subscription with data should report only multiple emails sent to slack', async () => {
            await createSubscription(
                ROLES.USER.id,
                {
                    datasets: ['viirs-active-fires']
                }
            );
            await createSubscription(
                ROLES.USER.id,
                {
                    datasets: ['viirs-active-fires']
                }
            );

            mockVIIRSAlertsGeostoreQuery(2);

            mockSparkpostMetricsCalls({
                "forest-fires-notification-viirs-es-mx": 2
            });
            mockSlackCalls({
                viirs: {
                    expected: 2,
                    actual: 2
                }
            });

            await EmailValidationService.validateSubscriptionEmailCount();
        });

        it('Slack notification with multiple viirs subscription but only one with data should report only one emails sent to slack', async () => {
            await createSubscription(
                ROLES.USER.id,
                {
                    datasets: ['viirs-active-fires']
                }
            );
            await createSubscription(
                ROLES.USER.id,
                {
                    datasets: ['viirs-active-fires']
                }
            );

            mockVIIRSAlertsGeostoreQuery(1);
            mockVIIRSAlertsGeostoreQuery(1, { data: [] });

            mockSparkpostMetricsCalls({
                "forest-fires-notification-viirs-es-mx": 1
            });
            mockSlackCalls({
                viirs: {
                    expected: 1,
                    actual: 1
                }
            });

            await EmailValidationService.validateSubscriptionEmailCount();
        });
    })

    afterEach(async () => {
        process.removeAllListeners('unhandledRejection');

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Subscription.deleteMany({}).exec();
        await Statistic.deleteMany({}).exec();
    });
});
