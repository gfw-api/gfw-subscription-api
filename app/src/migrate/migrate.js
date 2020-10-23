const config = require('config');
const sleep = require('sleep');
const request = require('request-promise-native');
const logger = require('logger');
const mongoose = require('mongoose');
const Subscription = require('models/subscription');

const mongooseOptions = require('../../../config/mongoose');

const uriMigrate = process.env.MIGRATE_URI || config.get('migrate.uri');

const mongoUri = process.env.MONGO_URI || `mongodb://${config.get('mongodb.host')}:${config.get('mongodb.port')}/${config.get('mongodb.database')}`;

const obtainData = async (cursor) => {
    let url = uriMigrate;
    if (cursor) {
        url += `?cursor=${cursor}`;
    }
    logger.debug('Doing request to ', url);
    let response = await request({
        url,
        method: 'GET',
        json: true
    });
    if (response.statusCode !== 200) {
        logger.error(response);
        logger.info('Waiting 5 seconds and trying');
        await sleep(5000);
        response = await request({
            url,
            method: 'GET',
            json: true
        });
    }
    return response.body;
};

const cacheUsers = {};
const obtainNewUserId = async (userId) => {
    try {
        logger.info('Obtaining user with data', userId);
        if (cacheUsers[userId]) {
            return cacheUsers[userId];
        }
        // let result = await microserviceClient.requestToMicroservice({
        //     uri: '/user/oldId/' + userId,
        //     method: 'GET',
        //     json: true
        // });

        // cacheUsers[userId] = result.body.data.id;
        // return result.body.data.id;
    } catch (e) {
        logger.error(e);
    }
    return null;
};
const createGeoJSON = async (geojsonParam) => {
    try {
        logger.info('Creating geostore');
        const json = {
            geojson: geojsonParam
        };
        if (typeof geojsonParam === 'string') {
            json.geojson = JSON.parse(geojsonParam);
        }
        // let result = await microserviceClient.requestToMicroservice({
        //     uri: '/geostore',
        //     method: 'POST',
        //     body: json,
        //     json: true
        // });

        // return result;
    } catch (e) {
        logger.error(e);
    }
};
logger.info('Setting info', process.env.API_GATEWAY_URL_MIGRATE);
// microserviceClient.setDataConnection({
//     apiGatewayUrl: process.env.API_GATEWAY_URL_MIGRATE
// });

const oldDatasets = {
    'alerts/treeloss': 'umd-loss-gain',
    'alerts/terra': 'terrai-alerts',
    'alerts/glad': 'glad-alerts',
    'alerts/prodes': 'prodes-loss',
    'alerts/viirs': 'viirs-active-fires',
    'alerts/guyra': 'guira-loss',
};

const tranformDataset = (oldDataset) => {
    if (oldDatasets[oldDataset]) {
        return oldDatasets[oldDataset];
    }
    return oldDataset;
};

const transformAndSaveData = async (data) => {
    logger.info('Saving data');
    if (data) {
        for (let i = 0, { length } = data; i < length; i++) {
            if (data[i].confirmed) {
                //  logger.debug('Saving data', data[i]);
                let userId = null;
                if (data[i].user_id) {
                    userId = await obtainNewUserId(data[i].user_id);
                } else {
                    logger.info('Subscription without user_id');
                }
                const language = data[i].language || 'en';

                if (
                    !data[i].params.iso
                    && !data[i].params.id1
                    && !data[i].params.wdpaid
                    && !data[i].params.use
                    && !data[i].params.useid
                    && !data[i].params.ifl
                    && !data[i].params.fl_id1
                    && !data[i].params.geostore
                ) {
                    if (!data[i].params.geom) {
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                    const geostore = await createGeoJSON(data[i].params.geom);
                    if (!geostore.body.data) {
                        logger.error('Is not correct');
                        logger.error(data[i].params.geom);
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                    data[i].geostore = geostore.body.data.id;
                }

                await new Subscription({
                    name: data[i].name,
                    confirmed: data[i].confirmed,
                    resource: {
                        type: 'EMAIL',
                        content: data[i].email
                    },
                    userId,
                    createdAt: data[i].created,
                    datasets: [tranformDataset(data[i].topic)],
                    language: language.toLowerCase(),
                    params: {
                        iso: {
                            country: data[i].iso || data[i].params.iso,
                            region: data[i].id1 || data[i].params.id1
                        },
                        geostore: data[i].geostore || data[i].params.geostore,
                        wdpaid: data[i].wdpaid || data[i].params.wdpaid,
                        use: data[i].use || data[i].params.use,
                        useId: data[i].useid || data[i].params.useid,
                        ifl: data[i].ifl || data[i].params.ifl,
                        fl_id1: data[i].fl_id1 || data[i].params.fl_id1
                    }
                }).save();

            } else {
                logger.debug('not confirmed');
            }
        }
    } else {
        logger.info('Empty list');
    }
};
const migrate = async () => {
    logger.info('Obtaining data');
    let data = await obtainData();

    while (data) {
        logger.debug('Obtained data');

        await transformAndSaveData(data.subscriptions);
        if (data.cursor) {
            data = await obtainData(data.cursor);
        } else {
            data = null;
        }
    }

    logger.debug('Finished migration');
};

const onDbReady = async () => {
    logger.info('Starting migration');

    await migrate();
    process.exit();
};

mongoose.connect(mongoUri, mongooseOptions, onDbReady);
