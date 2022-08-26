import logger from 'logger';
import moment from 'moment';
import { CronJob } from 'cron';
import config from 'config';
import { createClient, RedisClientType } from 'redis';
import EmailValidationService from 'services/emailValidationService';
import CRON_LIST, { Cron } from 'config/cron';
import { AlertQueueMessage } from 'queues/alert.queue';

const CHANNEL: string = config.get('apiGateway.subscriptionAlertsChannelName');

const getTask = async (task: Cron): Promise<void> => {
    const redisClient: RedisClientType = createClient({
        url: config.get('redis.url')
    });
    await redisClient.connect();

    logger.info(`[cronLoader] Publishing cron task of type/dataset ${task.dataset}`);

    switch (task.dataset) {
        case 'dataset':
            await redisClient.publish(CHANNEL, JSON.stringify({ layer_slug: task.dataset }));
            break;
        case 'subs-emails-validation':
            await EmailValidationService.validateSubscriptionEmailCount(moment());
            break;
        case 'glad-alerts':
        case 'monthly-summary':
        case 'viirs-active-fires':
            const message: AlertQueueMessage = {
                layer_slug: task.dataset,
                begin_date: moment().subtract(task.gap.value, task.gap.measure).subtract(task.periodicity.value, task.periodicity.measure).toISOString(),
                end_date: moment().subtract(task.gap.value, task.gap.measure).toDate().toISOString()
            }
            logger.info(`[cronLoader] Emitting message: ${JSON.stringify(message)} for dataset ${task.dataset}`);
            await redisClient.publish(CHANNEL, JSON.stringify(message));
            break;
        default:
            logger.error(`Cron task of type/dataset ${task.dataset} is not supported`);
    }
};

const load = (): CronJob[] => {
    logger.info('Running crons');
    return CRON_LIST.map((task: Cron) => {

        logger.info(`Creating cron task for ${task.name}`);

        const onDone = (): void => {
            logger.info(`[cronLoader] cron task ${task.name} finished successfully`);
        };

        return new CronJob(task.crontab, () => {
            getTask(task);
        }, onDone, true, 'Europe/London');
    });
};

export default {
    load,
    getTask
};
