import logger from 'logger';
import AlertQueue from 'queues/alert.queue';

const loadQueues: () => void = () => {
    logger.info('Loading queues...');
    (new AlertQueue()).init()
    logger.info('Loaded queues correctly!');
}

export default loadQueues;
