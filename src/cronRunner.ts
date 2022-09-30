import config from 'config';
import logger from 'logger';
import sleep from 'sleep';
import mongoose, { CallbackError, ConnectOptions } from 'mongoose';

import cronLoader from 'cronLoader';

const mongooseOptions: ConnectOptions = {
    readPreference: 'secondaryPreferred', // Has MongoDB prefer secondary servers for read operations.
    appName: 'subscriptions', // Displays the app name in MongoDB logs, for ease of debug
    serverSelectionTimeoutMS: 10000, // Number of milliseconds the underlying MongoDB driver has to pick a server
};

const mongoUri: string =
    process.env.MONGO_URI ||
    `mongodb://${config.get('mongodb.host')}:${config.get(
        'mongodb.port',
    )}/${config.get('mongodb.database')}`;

let retries: number = 10;

const init: () => Promise<void> = async (): Promise<void> => {
    return new Promise(
        (
            resolve: (value: (PromiseLike<void> | void)) => void,
            reject: (reason?: any) => void,
        ) => {
            function onDbReady(mongoConnectionError: CallbackError): void {
                if (mongoConnectionError) {
                    if (retries >= 0) {
                        retries--;
                        logger.error(
                            `Failed to connect to MongoDB uri ${mongoUri}, retrying...`,
                        );
                        logger.debug(mongoConnectionError);
                        sleep.sleep(5);
                        mongoose.connect(mongoUri, mongooseOptions, onDbReady);
                    } else {
                        logger.error('MongoURI', mongoUri);
                        logger.error(mongoConnectionError);
                        reject(new Error(mongoConnectionError.message));
                    }
                }
                logger.info(`Connected to MongoDB!`);

                cronLoader.run(process.argv[2]).then(
                    () => {
                        logger.info('Cron ran successfully');
                        resolve();
                    },
                    (err: any) => {
                        logger.error('Error running cron', err);
                        reject(err.message)
                    },
                );
            }

            logger.info(`Connecting to MongoDB URL ${mongoUri}`);

            mongoose.connect(mongoUri, mongooseOptions, onDbReady);
        },
    );
};

init()

