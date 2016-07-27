'use strict';
var logger = require('logger');
var Mustache = require('mustache');
var microserviceClient = require('microservice-client');
var JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
var viirsTemplate = require('services/template/viirs.json');
var request = require('co-request');
var CartoDB = require('cartodb');
var config = require('config');
var explode = require('turf-explode');


const WORLD = `SELECT ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON('{{{geojson}}}'),4326),3857)
      AS the_geom_webmercator`;

const ISO = `SELECT the_geom_webmercator
        FROM gadm2_countries_simple
        WHERE iso = UPPER('{{iso}}')`;
const ID1 = `SELECT the_geom_webmercator
        FROM gadm2_provinces_simple
        WHERE iso = UPPER('{{iso}}')
          AND id_1 = {{id1}}`;
const WDPA = `SELECT p.the_geom_webmercator
        FROM (
          SELECT CASE
          WHEN marine::numeric = 2 THEN NULL
            WHEN ST_NPoints(the_geom)<=18000 THEN the_geom_webmercator
            WHEN ST_NPoints(the_geom) BETWEEN 18000 AND 50000 THEN ST_RemoveRepeatedPoints(the_geom_webmercator, 0.001)
            ELSE ST_RemoveRepeatedPoints(the_geom_webmercator, 0.005)
            END AS the_geom_webmercator
          FROM wdpa_protected_areas
          WHERE wdpaid={{wdpaid}}
      ) p`;
const USE = `SELECT the_geom_webmercator
        FROM {{use_table}}
        WHERE cartodb_id = {{pid}}`;

const WORLD_BBOX = `SELECT ST_AsGeojson(ST_Expand(ST_Extent(ST_SetSRID(ST_GeomFromGeoJSON('{{{geojson}}}'),4326)),1))
      AS bbox`;

const ISO_BBOX = `SELECT ST_AsGeojson(ST_Expand(ST_Extent(the_geom),1)) AS bbox
        FROM gadm2_countries_simple
        WHERE iso = UPPER('{{iso}}')`;
const ID1_BBOX = `SELECT ST_AsGeojson(ST_Expand(ST_Extent(the_geom),1)) AS bbox
        FROM gadm2_provinces_simple
        WHERE iso = UPPER('{{iso}}')
          AND id_1 = {{id1}}`;
const WDPA_BBOX = `SELECT ST_AsGeojson(ST_Expand(ST_Extent(p.the_geom),1)) AS bbox
        FROM (
          SELECT CASE
          WHEN marine::numeric = 2 THEN NULL
            WHEN ST_NPoints(the_geom)<=18000 THEN the_geom
            WHEN ST_NPoints(the_geom) BETWEEN 18000 AND 50000 THEN ST_RemoveRepeatedPoints(the_geom, 0.001)
            ELSE ST_RemoveRepeatedPoints(the_geom, 0.005)
            END AS the_geom
          FROM wdpa_protected_areas
          WHERE wdpaid={{wdpaid}}
        ) p`;
const USE_BBOX = `SELECT ST_AsGeojson(ST_Expand(ST_Extent(the_geom),1)) AS bbox
        FROM {{use_table}}
        WHERE cartodb_id = {{pid}}`;

var deserializer = function(obj) {
    return function(callback) {
        new JSONAPIDeserializer({
            keyForAttribute: 'camelCase'
        }).deserialize(obj, callback);
    };
};

var executeThunk = function(client, sql, params) {
    return function(callback) {
        logger.debug(Mustache.render(sql, params));
        client.execute(sql, params).done(function(data) {
            callback(null, data);
        }).error(function(err) {
            callback(err, null);
        });
    };
};

function* getQuery(subscription) {
    if (subscription.params.iso && subscription.params.iso.country) {
        if (!subscription.params.iso.region) {
            return Mustache.render(ISO, {
                iso: subscription.params.iso.country
            });
        } else {
            return Mustache.render(ID1, {
                iso: subscription.params.iso.country,
                id1: subscription.params.iso.region
            });
        }
    } else if (subscription.params.wdpa) {
        return Mustache.render(WDPA, {
            wdpaid: subscription.params.wdpaid
        });
    } else if (subscription.params.use) {
        return Mustache.render(USE, {
            use_table: subscription.params.use,
            pid: subscription.params.useid
        });
    } else if (subscription.params.geostore) {
        let result = yield microserviceClient.requestToMicroservice({
            uri: '/geostore/' + subscription.params.geostore,
            method: 'GET',
            json: true
        });
        if (result.statusCode !== 200) {
            console.error('Error obtaining geostore:');
            console.error(result);
            return null;
        }

        let geostore = yield deserializer(result.body);
        return Mustache.render(WORLD, {
            geojson: geostore.geojson
        });
    }
}

function* getBBoxQuery(client, subscription) {
    if (subscription.params.iso && subscription.params.iso.country) {
        if (!subscription.params.iso.region) {

            let data = yield executeThunk(client, ISO_BBOX, {
                iso: subscription.params.iso.country
            });
            return data.rows[0].bbox;
        } else {
            let data = yield executeThunk(client, ID1_BBOX, {
                iso: subscription.params.iso.country,
                id1: subscription.params.iso.region
            });
            return data.rows[0].bbox;
        }
    } else if (subscription.params.wdpa) {
        let data = yield executeThunk(client, WDPA_BBOX, {
            wdpaid: subscription.params.wdpaid
        });
        return data.rows[0].bbox;
    } else if (subscription.params.use) {
        let data = yield executeThunk(client, USE_BBOX, {
            use_table: subscription.params.use,
            pid: subscription.params.useid
        });
        return data.rows[0].bbox;
    } else if (subscription.params.geostore) {
        let result = yield microserviceClient.requestToMicroservice({
            uri: '/geostore/' + subscription.params.geostore,
            method: 'GET',
            json: true
        });
        if (result.statusCode !== 200) {
            console.error('Error obtaining geostore:');
            console.error(result);
            return null;
        }

        let geostore = yield deserializer(result.body);
        let data = yield executeThunk(client, WORLD_BBOX, {
            geojson: geostore.geojson
        });
        return data.rows[0].bbox;
    }
}

function getBBoxOfGeojson(geojson){
    logger.debug('Explode geojson', geojson.type);
    let points = explode(geojson);
    let minx=360, miny = 360;
    let maxx=-360, maxy = -360;
    logger.debug('points', points);
    for(let i = 0, length = points.features.length; i < length; i++){
        logger.debug(points.features[i].geometry.coordinates);
        let point = points.features[i].geometry.coordinates;
        if(minx > point[0]){
            minx = point[0];
        }
        if(maxx < point[0]){
            maxx = point[0];
        }
        if(miny > point[1]){
            miny = point[1];
        }
        if(maxy < point[1]){
            maxy = point[1];
        }
    }
    return `${minx},${miny},${maxx},${maxy}`;
}

class ImageService {
    constructor(){
        this.client = new CartoDB.SQL({
            user: config.get('cartoDB.user')
        });
    }
    * overviewImage(subscription) {
        logger.info('Generating image');
        let begin = new Date(Date.now() - (24 * 60 * 60 * 1000));
        let query = yield getQuery(subscription);
        if (!query) {
            return null;
        }
        let config = {
            date: begin.toISOString().slice(0, 10),
            'query': query
        };

        let template = Mustache.render(JSON.stringify(viirsTemplate), config).replace(/\s\s+/g, ' ').trim();
        logger.debug(template);
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
        logger.debug('Result layergroupid', result.body );
        if (result.body.layergroupid) {
            logger.debug('Obtained layergroupid',result.body.layergroupid, 'Obtaining image' );
            let queryBBox = yield getBBoxQuery(this.client, subscription);

            let bbox = getBBoxOfGeojson(JSON.parse(queryBBox));
            let url = Mustache.render('http://wri-01.cartodb.com/api/v1/map/static/bbox/{{layergroupid}}/{{bbox}}/700/450.png', {
                layergroupid: result.body.layergroupid,
                bbox: bbox,
            });
            logger.debug('Url', url);
            // let resultImage = yield request({
            //     method: 'GET',
            //     url: url
            // });
            // if (resultImage.statusCode !== 200) {
            //     console.error('Error obtaining image');
            //     console.error(result);
            //     return null;
            // }
            // return resultImage.body;
            return url;
        }
    }
}

module.exports = new ImageService();
