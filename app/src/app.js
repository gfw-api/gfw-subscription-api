const config = require('config');
const logger = require('logger');
const path = require('path');
const koa = require('koa');
const koaLogger = require('koa-logger');
const koaQs = require('koa-qs');
const bodyParser = require('koa-body-parser');
const loader = require('loader');
const validate = require('koa-validate');
const ErrorSerializer = require('serializers/errorSerializer');
const sleep = require('sleep');

const mongoose = require('mongoose');
const mongoUri = process.env.MONGO_URI || 'mongodb://' + config.get('mongodb.host') + ':' + config.get('mongodb.port') + '/' + config.get('mongodb.database');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const cronLoader = require('cronLoader');

let retries = 10;

async function init() {
    return new Promise((resolve, reject) => {
        async function onDbReady(err) {
            if (err) {
                if (retries >= 0) {
                    retries--;
                    logger.error(`Failed to connect to MongoDB uri ${mongoUri}, retrying...`);
                    sleep.sleep(5);
                    mongoose.connect(mongoUri, { useNewUrlParser: true }, onDbReady);
                } else {
                    logger.error('MongoURI', mongoUri);
                    logger.error(err);
                    reject(new Error(err));
                }

                return;
            }

            // instance of koa
            var app = koa();

            //if environment is dev then load koa-logger
            if (process.env.NODE_ENV === 'dev') {
                logger.debug('Use logger');
                app.use(koaLogger());
            }

            koaQs(app, 'extended');
            app.use(bodyParser());

            //catch errors and send in jsonapi standard. Always return vnd.api+json
            app.use(function* (next) {
                try {
                    yield next;
                } catch (err) {
                    this.status = err.status || 500;
                    if (this.status >= 500) {
                        logger.error(err);
                    } else {
                        logger.info(err);
                    }
                    this.body = ErrorSerializer.serializeError(this.status, err.message);
                    if (process.env.NODE_ENV === 'prod' && this.status === 500) {
                        this.body = 'Unexpected error';
                    }
                }
                // this.response.type = 'application/vnd.api+json';
            });

            //load custom validator
            app.use(validate());

            //load routes
            loader.loadRoutes(app);

            //Instance of http module
            var server = require('http').Server(app.callback());

            // get port of environment, if not exist obtain of the config.
            // In production environment, the port must be declared in environment variable
            var port = process.env.PORT || config.get('service.port');

            server.listen(port, function () {

                ctRegisterMicroservice.register({
                    info: require('../microservice/register.json'),
                    swagger: require('../microservice/public-swagger.json'),
                    mode: (process.env.CT_REGISTER_MODE && process.env.CT_REGISTER_MODE === 'auto') ? ctRegisterMicroservice.MODE_AUTOREGISTER : ctRegisterMicroservice.MODE_NORMAL,
                    framework: ctRegisterMicroservice.KOA1,
                    app,
                    logger,
                    name: config.get('service.name'),
                    ctUrl: process.env.CT_URL,
                    url: process.env.LOCAL_URL,
                    token: process.env.CT_TOKEN,
                    active: true,
                }).then(() => {
                }, (err) => {
                    logger.error(err);
                    process.exit(1);
                });


                cronLoader.load();
            });

            logger.info('Server started in ', process.env.PORT);
            resolve({ app, server });
        }

        logger.info(`Connecting to MongoDB URL ${mongoUri}`);
        mongoose.connect(mongoUri, onDbReady);
    });
}


module.exports = init;
