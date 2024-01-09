import config from 'config';
import logger from 'logger';
import Koa from 'koa';
import koaLogger from 'koa-logger';
import koaBody from 'koa-body';
import router from 'routes/subscription.router'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import koaSimpleHealthCheck from 'koa-simple-healthcheck';
import ErrorSerializer from 'serializers/error.serializer';
import sleep from 'sleep';
import mongoose, { CallbackError, ConnectOptions } from 'mongoose';
import { RWAPIMicroservice } from 'rw-api-microservice-node';
import koaQs from 'koa-qs';
import { Server } from 'http';

import cronLoader from 'cronLoader';
import loadQueues from 'loader';

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

interface IInit {
    server: Server;
    app: Koa;
}

const init: () => Promise<IInit> = async (): Promise<IInit> => {
    return new Promise(
        (
            resolve: (value: IInit | PromiseLike<IInit>) => void,
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

                // instance of koa
                const app: Koa = new Koa();
                app.use(koaSimpleHealthCheck());
                app.use(koaLogger());

                koaQs(app, 'extended');
                app.use(
                    koaBody({
                        multipart: true,
                        jsonLimit: '50mb',
                        formLimit: '50mb',
                        textLimit: '50mb',
                    }),
                );

                // catch errors and send in jsonapi standard. Always return vnd.api+json
                app.use(async (ctx: { status: number; response: { type: string; }; body: any; }, next: () => any) => {
                    try {
                        await next();
                    } catch (error) {
                        ctx.status = error.status || 500;

                        if (ctx.status >= 500) {
                            logger.error(error);
                        } else {
                            logger.info(error);
                        }

                        if (process.env.NODE_ENV === 'prod' && ctx.status === 500) {
                            ctx.response.type = 'application/vnd.api+json';
                            ctx.body = ErrorSerializer.serializeError(ctx.status, 'Unexpected error');
                            return;
                        }

                        ctx.response.type = 'application/vnd.api+json';
                        ctx.body = ErrorSerializer.serializeError(ctx.status, error.message);
                    }
                });

                app.use(
                    RWAPIMicroservice.bootstrap({
                        logger,
                        gatewayURL: process.env.GATEWAY_URL,
                        microserviceToken: process.env.MICROSERVICE_TOKEN,
                        fastlyEnabled: process.env.FASTLY_ENABLED as | boolean | 'true' | 'false',
                        fastlyServiceId: process.env.FASTLY_SERVICEID,
                        fastlyAPIKey: process.env.FASTLY_APIKEY,
                        requireAPIKey: process.env.REQUIRE_API_KEY as boolean | 'true' | 'false' || true,
                        awsCloudWatchLoggingEnabled: process.env.AWS_CLOUD_WATCH_LOGGING_ENABLED as boolean | 'true' | 'false' || true,
                        awsRegion: process.env.AWS_REGION,
                        awsCloudWatchLogStreamName: config.get('service.name'),
                    }),
                );

                // load API routes
                app.use(router.middleware());

                // load queues
                loadQueues();

                // Instance of http module
                // const server from ('http').Server(app.callback());

                // get port of environment, if not exist obtain of the config.
                // In production environment, the port must be declared in environment variable
                const port: number = parseInt(config.get('service.port'), 10);

                const server: Server = app.listen(port, () => {
                    if (config.get('settings.loadCron') && config.get('settings.loadCron') !== 'false') {
                        cronLoader.load();
                        logger.info('[app] Cron tasks loaded');
                    } else {
                        logger.info('[app] Skipping cron loading per configuration');
                    }
                });

                logger.info('Server started in ', process.env.PORT);
                resolve({ app, server });
            }

            logger.info(`Connecting to MongoDB URL ${mongoUri}`);

            mongoose.connect(mongoUri, mongooseOptions, onDbReady);
        },
    );
};

export { init };
