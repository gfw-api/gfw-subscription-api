const config = require('config');
const logger = require('logger');
const Koa = require('koa');
const koaLogger = require('koa-logger');
const koaQs = require('koa-qs');
const koaBody = require('koa-body');
const loader = require('loader');
const koaSimpleHealthCheck = require('koa-simple-healthcheck');
const ErrorSerializer = require('serializers/errorSerializer');
const sleep = require('sleep');
const mongoose = require('mongoose');
const { RWAPIMicroservice } = require('rw-api-microservice-node');

const cronLoader = require('cronLoader');
const mongooseOptions = require('../../config/mongoose');

const mongoUri = process.env.MONGO_URI || `mongodb://${config.get('mongodb.host')}:${config.get('mongodb.port')}/${config.get('mongodb.database')}`;

let retries = 10;

if (config.get('logger.level') === 'debug') {
    logger.debug('Setting mongoose debug logging on');

    mongoose.set('debug', true);
    mongoose.connection.on('connecting', () => {
        logger.debug('Mongoose attempting to connect');
    });
    mongoose.connection.on('connected', () => {
        logger.debug('Mongoose connected to the initial server');
    });
    mongoose.connection.on('fullsetup', () => {
        logger.debug('Mongoose connected to the primary server and at least a secondary server');
    });
    mongoose.connection.on('all', () => {
        logger.debug('Mongoose connected to all servers');
    });
}

async function init() {
    return new Promise((resolve, reject) => {
        async function onDbReady(mongoConnectionError) {
            if (mongoConnectionError) {
                if (retries >= 0) {
                    retries--;
                    logger.error(`Failed to connect to MongoDB uri ${mongoUri}, retrying...`);
                    logger.debug(mongoConnectionError);
                    sleep.sleep(5);
                    mongoose.connect(mongoUri, mongooseOptions, onDbReady);
                } else {
                    logger.error('MongoURI', mongoUri);
                    logger.error(mongoConnectionError);
                    reject(new Error(mongoConnectionError));
                }

                return;
            }

            // instance of koa
            const app = new Koa();

            // if environment is dev then load koa-logger
            if (process.env.NODE_ENV === 'dev') {
                logger.debug('Use logger');
                app.use(koaLogger());
            }

            koaQs(app, 'extended');
            app.use(koaBody({
                multipart: true,
                jsonLimit: '50mb',
                formLimit: '50mb',
                textLimit: '50mb'
            }));
            app.use(koaSimpleHealthCheck());

            // catch errors and send in jsonapi standard. Always return vnd.api+json
            app.use(async (ctx, next) => {
                try {
                    await next();
                } catch (inErr) {
                    let error;
                    try {
                        error = JSON.parse(inErr);
                    } catch (e) {
                        logger.debug('Could not parse error message - is it JSON?: ', inErr);
                        error = inErr;
                    }
                    ctx.status = error.status || ctx.status || 500;
                    if (ctx.status >= 500) {
                        logger.error(error);
                    } else {
                        logger.info(error);
                    }

                    ctx.body = ErrorSerializer.serializeError(ctx.status, error.message);
                    if (process.env.NODE_ENV === 'prod' && ctx.status === 500) {
                        ctx.body = 'Unexpected error';
                    }
                    ctx.response.type = 'application/vnd.api+json';
                }
            });

            app.use(RWAPIMicroservice.bootstrap({
                name: config.get('service.name'),
                info: require('../microservice/register.json'),
                swagger: require('../microservice/public-swagger.json'),
                logger,
                baseURL: process.env.CT_URL,
                url: process.env.LOCAL_URL,
                token: process.env.CT_TOKEN,
                fastlyEnabled: process.env.FASTLY_ENABLED,
                fastlyServiceId: process.env.FASTLY_SERVICEID,
                fastlyAPIKey: process.env.FASTLY_APIKEY
            }));

            // load API routes
            loader.loadRoutes(app);

            // load queues
            loader.loadQueues(app);

            // Instance of http module
            // const server = require('http').Server(app.callback());

            // get port of environment, if not exist obtain of the config.
            // In production environment, the port must be declared in environment variable
            const port = process.env.PORT || config.get('service.port');

            const server = app.listen(port, () => {
                if (process.env.CT_REGISTER_MODE === 'auto') {
                    RWAPIMicroservice.register().then(() => {
                        logger.info('CT registration process started');
                    }, (error) => {
                        logger.error(error);
                        process.exit(1);
                    });
                }

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
    });
}

module.exports = init;
