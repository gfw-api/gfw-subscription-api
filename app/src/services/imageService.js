const logger = require('logger');
const Mustache = require('mustache');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
const request = require('request-promise-native');
const CartoDB = require('cartodb');
const config = require('config');
const explode = require('turf-explode');
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

const executeThunk = (client, sql, params) => (
    new Promise((resolve, reject) => {
        client.execute(sql, params).done((data) => resolve(data)).error((err) => reject(err));
    }));

async function getQuery(subscription) {
    if (subscription.params.iso && subscription.params.iso.country) {
        if (!subscription.params.iso.region) {
            return Mustache.render(geoQuery.ISO, {
                iso: subscription.params.iso.country
            });
        }
        return Mustache.render(geoQuery.ID1, {
            iso: subscription.params.iso.country,
            id1: subscription.params.iso.region
        });

    }
    if (subscription.params.wdpaid) {
        return Mustache.render(geoQuery.WDPA, {
            wdpaid: subscription.params.wdpaid
        });
    }
    if (subscription.params.use) {
        return Mustache.render(geoQuery.USE, {
            use_table: subscription.params.use,
            pid: subscription.params.useid
        });
    }
    if (subscription.params.geostore) {
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri: `/geostore/${subscription.params.geostore}`,
                method: 'GET',
                json: true
            });

            const geostore = await new JSONAPIDeserializer({
                keyForAttribute: 'camelCase'
            }).deserialize(result);
            logger.debug(`Geostore geometry: ${JSON.stringify(geostore.geojson.features[0].geometry)}`);
            const renderedQuery = Mustache.render(geoQuery.WORLD, {
                geojson: JSON.stringify(geostore.geojson.features[0].geometry).replace(/"/g, '\\"')
            });

            logger.debug(`Query: ${renderedQuery}`);

            return renderedQuery;
        } catch (e) {
            logger.error(e);
            return null;
        }

    }

    return null;
}

async function getBBoxQuery(client, subscription) {
    if (subscription.params.iso && subscription.params.iso.country) {
        if (!subscription.params.iso.region) {

            const data = await executeThunk(client, geoQuery.ISO_BBOX, {
                iso: subscription.params.iso.country
            });
            return data.rows[0].bbox;
        }
        const data = await executeThunk(client, geoQuery.ID1_BBOX, {
            iso: subscription.params.iso.country,
            id1: subscription.params.iso.region
        });
        return data.rows[0].bbox;

    }
    if (subscription.params.wdpaid) {
        const data = await executeThunk(client, geoQuery.WDPA_BBOX, {
            wdpaid: subscription.params.wdpaid
        });
        return data.rows[0].bbox;
    }
    if (subscription.params.use) {
        const data = await executeThunk(client, geoQuery.USE_BBOX, {
            use_table: subscription.params.use,
            pid: subscription.params.useid
        });
        return data.rows[0].bbox;
    }
    if (subscription.params.geostore) {
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri: `/geostore/${subscription.params.geostore}`,
                method: 'GET',
                json: true
            });

            const geostore = await new JSONAPIDeserializer({
                keyForAttribute: 'camelCase'
            }).deserialize(result);
            const data = await executeThunk(client, geoQuery.WORLD_BBOX, {
                geojson: JSON.stringify(geostore.geojson.features[0].geometry)

            });
            return data.rows[0].bbox;
        } catch (e) {
            logger.error('Error obtaining geostore', e);
            return null;
        }
    }

    return null;
}

function getBBoxOfGeojson(geojson) {
    const points = explode(geojson);
    let minx = 360;
    let
        miny = 360;
    let maxx = -360;
    let
        maxy = -360;
    for (let i = 0, { length } = points.features; i < length; i++) {
        const point = points.features[i].geometry.coordinates;
        if (minx > point[0]) {
            [minx] = point;
        }
        if (maxx < point[0]) {
            [maxx] = point;
        }
        if (miny > point[1]) {
            [, miny] = point;
        }
        if (maxy < point[1]) {
            [, maxy] = point;
        }
    }
    return `${minx},${miny},${maxx},${maxy}`;
}

async function getCartoStaticImage(url) {
    return request({
        url,
        method: 'GET',
        encoding: null,
        headers: {
            'Content-Type': 'image/png'
        },
        resolveWithFullResponse: true
    });
}

async function getS3Url(imageKey, staticImage) {
    const s3 = new AWS.S3();

    return new Promise((fulfill) => {
        s3.upload({
            Bucket: 'gfw2stories',
            Key: `map_preview/${imageKey}`,
            ContentType: staticImage.headers['content-type'],
            ACL: 'public-read',
            Body: staticImage.body
        }, (err, data) => {
            if (err !== null) {
                fulfill(null);
            } else {
                fulfill(data.Location);
            }
        });
    });
}

async function getImageUrl(layergroupid, bbox) {
    const imageKey = `${layergroupid}_${bbox}.png`;
    const staticImage = await getCartoStaticImage(`http://${process.env.CARTODB_USER}.cartodb.com/api/v1/map/static/bbox/${layergroupid}/${bbox}/700/450.png`);
    return getS3Url(imageKey, staticImage);
}

async function getStaticMapImageUrl(subscription) {
  // get geojson from geostore from subscription and simplify
  const simpleGeostore = simplify(this.state.geostore.geojson, { tolerance: 0.05 });

  // get geojson from feature
  const simpGeostore = simpleGeostore.features[0];

  // create two geojson simplestyle geometries
  // green outline
  const geojson = {
    ...simpGeostore,
    properties: {
      fill: 'transparent',
      stroke: '%23C0FF24',
      'stroke-width': 2
    }
  };

  // black outline
  const geojsonOutline = {
    ...simpGeostore,
    properties: {
      fill: 'transparent',
      stroke: '%23000',
      'stroke-width': 5
    }
  };

  // return mapbox static map url
  return `https://api.mapbox.com/styles/v1/resourcewatch/cjhqiecof53wv2rl9gw4cehmy/static/geojson(${JSON.stringify(geojsonOutline)}),geojson(${JSON.stringify(geojson)})/auto/${width}x${height}@2x?access_token=${process.env.MapboxAccessToken}&attribution=false&logo=false`;
}

class ImageService {

    constructor() {
        this.client = new CartoDB.SQL({
            user: config.get('cartoDB.user')
        });
    }

    async overviewImage(subscription, slug, begin, end) {
        const query = await getQuery(subscription);
        if (!query) {
            return null;
        }
        const mustacheConfig = {
            begin: begin.toISOString().slice(0, 10),
            end: end.toISOString().slice(0, 10),
            query
        };

        const template = Mustache.render(JSON.stringify(LAYERS_PARAMS_MAP[slug]), mustacheConfig).replace(/\s\s+/g, ' ').trim();
        const result = await request({
            url: `https://${process.env.CARTODB_USER}.cartodb.com/api/v1/map`,
            method: 'POST',
            body: template,
            headers: {
                'Content-Type': 'application/json'
            },
            resolveWithFullResponse: true
        });
        if (result.statusCode !== 200) {
            logger.info('Error obtaining layergroupid');
            logger.info(result.body);
            return null;
        }
        result.body = JSON.parse(result.body);
        if (result.body.layergroupid) {
            const queryBBox = await getBBoxQuery(this.client, subscription);
            const bbox = getBBoxOfGeojson(JSON.parse(queryBBox));
            return getImageUrl(result.body.layergroupid, bbox);
        }
        return null;

    }

}

module.exports = new ImageService();
