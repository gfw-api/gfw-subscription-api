import logger from 'logger';
import moment from 'moment';
import { CronJob } from 'cron';
import config from 'config';
import UpdateService, { UpdateServiceResponse } from 'services/updateService';
import { createClient, RedisClientType } from 'redis';
import EmailValidationService from 'services/emailValidationService';
import CRON_LIST, { Cron } from 'config/cron';

const CHANNEL: string = config.get('apiGateway.subscriptionAlertsChannelName');

const supportedAlertTypes: string[] = [
    'monthly-summary',
    'viirs-active-fires',
    'glad-alerts',
    'glad-all',
    'glad-l',
    'glad-s2',
    'glad-radd',
];

const getTask = async (task: Cron): Promise<void> => {
    const redisClient: RedisClientType = createClient({
        url: config.get('redis.url')
    });
    await redisClient.connect();

    logger.info(`[cronLoader] Publishing ${task.dataset}`);
    if (task.dataset === 'dataset') {
        await redisClient.publish(CHANNEL, JSON.stringify({ layer_slug: task.dataset }));
        return;
    }

    if (task.dataset === 'subs-emails-validation') {
        await EmailValidationService.validateSubscriptionEmailCount(moment());
        return;
    }

    if (supportedAlertTypes.includes(task.dataset)) {
        const message: string = JSON.stringify({
            layer_slug: task.dataset,
            begin_date: moment().subtract(task.gap.value, task.gap.measure).subtract(task.periodicity.value, task.periodicity.measure).toDate(),
            end_date: moment().subtract(task.gap.value, task.gap.measure).toDate()
        });

        logger.info(`[cronLoader] Emitting message: ${message} for dataset ${task.dataset}`);

        await redisClient.publish(CHANNEL, message);
        return;
    }

    logger.info(`Checking if dataset '${task.dataset}' was updated`);
    const result: UpdateServiceResponse = await UpdateService.checkUpdated(task.dataset);
    if (result.updated) {
        const message: string = JSON.stringify({
            layer_slug: task.dataset,
            begin_date: new Date(result.beginDate),
            end_date: new Date(result.endDate)
        });

        logger.info(`[cronLoader] Emitting message: ${message} for dataset ${task.dataset}`);

        await redisClient.publish(CHANNEL, message);
    } else {
        logger.info(`${task.dataset} was not updated`);
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
