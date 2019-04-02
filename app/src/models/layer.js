'use strict';

// var microserviceClient = require('vizz.microservice-client');
var JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;

var deserializer = function (obj) {
    return function (callback) {
        new JSONAPIDeserializer({}).deserialize(obj, callback);
    };
};

const LAYERS = [{
    name: 'loss',
    slug: 'umd-loss-gain',
    subscription: true
}, {
    name: 'imazon',
    slug: 'imazon-alerts',
    subscription: true
}, {
    name: 'terrailoss',
    slug: 'terrai-alerts',
    subscription: true
}, {
    name: 'prodes',
    slug: 'prodes-loss',
    subscription: true
}, {
    name: 'guyra',
    slug: 'guira-loss',
    subscription: true
}, {
    name: 'viirs_fires_alerts',
    slug: 'viirs-active-fires',
    subscription: true
}, {
    name: 'umd_as_it_happens',
    slug: 'glad-alerts',
    subscription: true
}, {
    name: 'umd_as_it_happens_per',
    slug: 'glad-alerts',
    subscription: true
}, {
    name: 'umd_as_it_happens_cog',
    slug: 'glad-alerts',
    subscription: true
}, {
    name: 'umd_as_it_happens_idn',
    slug: 'glad-alerts',
    subscription: true
}, {
    name: 'story',
    slug: 'story',
    subscription: true
}, {
    name: 'forma-alerts',
    slug: 'forma-alerts',
    subscription: true
}, {
    name: 'forma250GFW',
    slug: 'forma250GFW',
    subscription: true
}];

class Layer {

    static* findBySlug(slug) {
        // This code is valid until the refactor is made
        for (let i = 0, length = LAYERS.length; i < length; i++) {
            if (LAYERS[i].slug === slug) {
                return LAYERS[i];
            }
        }
        return null;

        // Correct code but also front not support new layerspec
        // let result = yield microserviceClient.requestToMicroservice({
        //   uri: '/layers/' + slug,
        //   method: 'GET',
        //   json: true
        // });
        //
        // if (result.statusCode !== 200) {
        //   console.error('Error obtaining layer:');
        //   console.error(result.body);
        //   return null;
        // }
        //
        // return yield deserializer(result.body);
    }

}

module.exports = Layer;
