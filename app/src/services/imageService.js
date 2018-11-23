'use strict';
var logger = require('logger');
var Mustache = require('mustache');
const ctRegisterMicroservice = require('ct-register-microservice-node');
var JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
var request = require('co-request');
var CartoDB = require('cartodb');
var config = require('config');
var explode = require('turf-explode');
const AWS = require('aws-sdk');

const geoQuery = require('services/imageService/geoQuery.json');
const viirsTemplate = require('services/imageService/template/viirs.json');
const formaAlertsTemplate = require('services/imageService/template/forma-alerts.json');
const imazonAlertsTemplate = require('services/imageService/template/imazon-alerts.json');

const LAYERS_PARAMS_MAP = {
    'viirs-active-fires': viirsTemplate,
    'forma-alerts': formaAlertsTemplate,
    'imazon-alerts': imazonAlertsTemplate
};

var deserializer = function (obj) {
    return function (callback) {
        new JSONAPIDeserializer({
            keyForAttribute: 'camelCase'
        }).deserialize(obj, callback);
    };
};

var executeThunk = function (client, sql, params) {
    return function (callback) {
        client.execute(sql, params).done(function (data) {
            callback(null, data);
        }).error(function (err) {
            callback(err, null);
        });
    };
};

function* getQuery(subscription) {
    if (subscription.params.iso && subscription.params.iso.country) {
        if (!subscription.params.iso.region) {
            return Mustache.render(geoQuery.ISO, {
                iso: subscription.params.iso.country
            });
        } else {
            return Mustache.render(geoQuery.ID1, {
                iso: subscription.params.iso.country,
                id1: subscription.params.iso.region
            });
        }
    } else if (subscription.params.wdpaid) {
        return Mustache.render(geoQuery.WDPA, {
            wdpaid: subscription.params.wdpaid
        });
    } else if (subscription.params.use) {
        return Mustache.render(geoQuery.USE, {
            use_table: subscription.params.use,
            pid: subscription.params.useid
        });
    } else if (subscription.params.geostore) {
        try {
            let result = yield ctRegisterMicroservice.requestToMicroservice({
                uri: '/geostore/' + subscription.params.geostore,
                method: 'GET',
                json: true
            });

            let geostore = yield deserializer(result);
            console.log(JSON.stringify(geostore.geojson.features[0].geometry));
            return Mustache.render(geoQuery.WORLD, {
                geojson: JSON.stringify(geostore.geojson.features[0].geometry).replace(/"/g, '\\"')
            });
        } catch (e) {
            logger.error(e);
            return null;
        }

    }
}

function* getBBoxQuery(client, subscription) {
    if (subscription.params.iso && subscription.params.iso.country) {
        if (!subscription.params.iso.region) {

            let data = yield executeThunk(client, geoQuery.ISO_BBOX, {
                iso: subscription.params.iso.country
            });
            return data.rows[0].bbox;
        } else {
            let data = yield executeThunk(client, geoQuery.ID1_BBOX, {
                iso: subscription.params.iso.country,
                id1: subscription.params.iso.region
            });
            return data.rows[0].bbox;
        }
    } else if (subscription.params.wdpaid) {
        let data = yield executeThunk(client, geoQuery.WDPA_BBOX, {
            wdpaid: subscription.params.wdpaid
        });
        return data.rows[0].bbox;
    } else if (subscription.params.use) {
        let data = yield executeThunk(client, geoQuery.USE_BBOX, {
            use_table: subscription.params.use,
            pid: subscription.params.useid
        });
        return data.rows[0].bbox;
    } else if (subscription.params.geostore) {
        try {
            let result = yield ctRegisterMicroservice.requestToMicroservice({
                uri: '/geostore/' + subscription.params.geostore,
                method: 'GET',
                json: true
            });

            let geostore = yield deserializer(result);
            let data = yield executeThunk(client, geoQuery.WORLD_BBOX, {
                geojson: JSON.stringify(geostore.geojson.features[0].geometry)

            });
            return data.rows[0].bbox;
        } catch (e) {
            logger.error('Error obtaining geostore', e);
            return null;
        }
    }
}

function getBBoxOfGeojson(geojson) {
    let points = explode(geojson);
    let minx = 360, miny = 360;
    let maxx = -360, maxy = -360;
    for (let i = 0, length = points.features.length; i < length; i++) {
        let point = points.features[i].geometry.coordinates;
        if (minx > point[0]) {
            minx = point[0];
        }
        if (maxx < point[0]) {
            maxx = point[0];
        }
        if (miny > point[1]) {
            miny = point[1];
        }
        if (maxy < point[1]) {
            maxy = point[1];
        }
    }
    return `${minx},${miny},${maxx},${maxy}`;
}

function* getCartoStaticImage(url) {
    return yield request({
        url: url,
        method: 'GET',
        encoding: null,
        headers: {
            'Content-Type': 'image/png'
        }
    });
}

function* getS3Url(imageKey, staticImage) {
    const s3 = new AWS.S3();

    return yield new Promise(function (fulfill, reject) {
        s3.upload({
            Bucket: 'gfw2stories',
            Key: `map_preview/${imageKey}`,
            ContentType: staticImage.headers['content-type'],
            ACL: 'public-read',
            Body: staticImage.body
        }, function (err, data) {
            if (err !== null) {
                fulfill(null);
            } else {
                fulfill(data.Location);
            }
        });
    });
}

function* getImageUrl(layergroupid, bbox) {
    const imageKey = `${layergroupid}_${bbox}.png`;
    const staticImage = yield getCartoStaticImage(`http://wri-01.cartodb.com/api/v1/map/static/bbox/${layergroupid}/${bbox}/700/450.png`);
    return yield getS3Url(imageKey, staticImage);
}

class ImageService {
    constructor() {
        this.client = new CartoDB.SQL({
            user: config.get('cartoDB.user')
        });
    }

    * overviewImage(subscription, slug, begin, end) {
        let query = yield getQuery(subscription);
        if (!query) {
            return null;
        }
        let config = {
            begin: begin.toISOString().slice(0, 10),
            end: end.toISOString().slice(0, 10),
            'query': query
        };

        let template = Mustache.render(JSON.stringify(LAYERS_PARAMS_MAP[slug]), config).replace(/\s\s+/g, ' ').trim();
        let result = yield request({
            url: 'https://wri-01.cartodb.com/api/v1/map',
            method: 'POST',
            body: template,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (result.statusCode !== 200) {
            console.error('Error obtaining layergroupid');
            console.error(result.body);
            return null;
        }
        result.body = JSON.parse(result.body);
        if (result.body.layergroupid) {
            let queryBBox = yield getBBoxQuery(this.client, subscription);
            let bbox = getBBoxOfGeojson(JSON.parse(queryBBox));
            return yield getImageUrl(result.body.layergroupid, bbox);
        } else {
            return null;
        }
    }
}

module.exports = new ImageService();
