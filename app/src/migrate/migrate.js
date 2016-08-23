'use strict';
var config = require('config');
var sleep = require('co-sleep');
var request = require('co-request');
var logger = require('logger');
var co = require('co');
var mongoose = require('mongoose');

var uriMigrate = process.env.MIGRATE_URI || config.get('migrate.uri');
var mongoUri = process.env.MONGO_URI || 'mongodb://' + config.get('mongodb.host') + ':' + config.get('mongodb.port') + '/' + config.get('mongodb.database');

let Subscription = require('models/subscription');

var microserviceClient = require('vizz.microservice-client');

var obtainData = function*(cursor) {
    let url = uriMigrate;
    if (cursor) {
        url += '?cursor=' + cursor;
    }
    logger.debug('Doing request to ', url);
    var response = yield request({
        url: url,
        method: 'GET',
        json: true
    });
    if (response.statusCode !== 200) {
        logger.error(response);
        logger.info('Waiting 5 seconds and trying');
        yield sleep(5000);
        response = yield request({
            url: url,
            method: 'GET',
            json: true
        });
    }
    return response.body;
};

let cacheUsers = {};
var obtainNewUserId = function*(userId) {
    try {
        logger.info('Obtaining user with data', userId);
        if (cacheUsers[userId]) {
            return cacheUsers[userId];
        }
        let result = yield microserviceClient.requestToMicroservice({
            uri: '/user/oldId/' + userId,
            method: 'GET',
            json: true
        });


        cacheUsers[userId] = result.body.data.id;
        return result.body.data.id;
    } catch (e) {
        logger.error(e);
    }
};

var createGeoJSON = function*(geojsonParam) {
    try {
        logger.info('Creating geostore');
        let json = {
            geojson: geojsonParam
        };
        if (typeof geojsonParam === "string") {
            json.geojson = JSON.parse(geojsonParam);
        }
        let result = yield microserviceClient.requestToMicroservice({
            uri: '/geostore',
            method: 'POST',
            body: json,
            json: true
        });


        return result;
    } catch (e) {
        logger.error(e);
    }
};
logger.info('Setting info', process.env.API_GATEWAY_URL_MIGRATE);
microserviceClient.setDataConnection({
    apiGatewayUrl: process.env.API_GATEWAY_URL_MIGRATE
});

var oldDatasets = {
    'alerts/treeloss': 'umd-loss-gain',
    'alerts/terra': 'terrai-alerts',
    'alerts/glad': 'glad-alerts',
    'alerts/prodes': 'prodes-loss',
    'alerts/viirs': 'viirs-active-fires',
    'alerts/guyra': 'guira-loss',
    'alerts/sad': 'imazon-alerts'
};

var tranformDataset = function(oldDataset) {
    if (oldDatasets[oldDataset]) {
        return oldDatasets[oldDataset];
    }
    return oldDataset;
}

var transformAndSaveData = function*(data) {
    logger.info('Saving data');
    if (data) {
        for (let i = 0, length = data.length; i < length; i++) {
            if (data[i].confirmed) {
                //  logger.debug('Saving data', data[i]);
                let userId = null;
                if (data[i].user_id) {
                    userId = yield obtainNewUserId(data[i].user_id);
                } else {
                    logger.info('Subscription without user_id');
                }
                let language = data[i].language || 'en';

                if (!data[i].params.iso && !data[i].params.id1 && !data[i].params.wdpaid && !data[i].params.use && !data[i].params.useid && !data[i].params.ifl && !data[i].params.fl_id1 && !data[i].params.geostore) {
                    if(!data[i].params.geom){
                        continue;
                     }
                     let geostore = yield createGeoJSON(data[i].params.geom);
                     if(!geostore.body.data){
                        logger.error('Is not correct');
                        logger.error(data[i].params.geom);
                        continue;
                     }
                     data[i].geostore = geostore.body.data.id;
                }

                yield new Subscription({
                    name: data[i].name,
                    confirmed: data[i].confirmed,
                    resource: {
                        type: 'EMAIL',
                        content: data[i].email
                    },
                    userId: userId,
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
        logger.ingo('Empty list');
    }
};

var migrate = function*() {
    logger.info('Obtaining data');
    var data = yield obtainData();

    while (data) {
        logger.debug('Obtained data');

        let element = null;
        let model, idConn = null;
        yield transformAndSaveData(data.subscriptions);
        if (data.cursor) {
            data = yield obtainData(data.cursor);
        } else  {
            data = null;
        }
    }

    logger.debug('Finished migration');
};
var onDbReady = function() {
    co(function*() {
        logger.info('Starting migration');

        yield migrate();
        process.exit();
    });
};
mongoose.connect(mongoUri, onDbReady);
