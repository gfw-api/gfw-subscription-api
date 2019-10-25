const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;

const deserializer = function (obj) {
    return function (callback) {
        new JSONAPIDeserializer({}).deserialize(obj, callback);
    };
};

const LAYERS = [{
    name: 'loss',
    slug: 'umd-loss-gain',
    subscription: true,
    dataset: '897ecc76-2308-4c51-aeb3-495de0bdca79',
    layers: ['c3075c5a-5567-4b09-bc0d-96ed1673f8b6']
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
    subscription: true,
    dataset: '0f0ea013-20ac-4f4b-af56-c57e99f39e08',
    layers: ['5371d0c0-4e5f-45f7-9ff2-fe538914f7a3']
}, {
    name: 'umd_as_it_happens',
    slug: 'glad-alerts',
    subscription: true,
    dataset: 'e663eb09-04de-4f39-b871-35c6c2ed10b5',
    layers: ['dd5df87f-39c2-4aeb-a462-3ef969b20b66']
}, {
    name: 'umd_as_it_happens_per',
    slug: 'glad-alerts',
    subscription: true,
    dataset: 'e663eb09-04de-4f39-b871-35c6c2ed10b5',
    layers: ['dd5df87f-39c2-4aeb-a462-3ef969b20b66']
}, {
    name: 'umd_as_it_happens_cog',
    slug: 'glad-alerts',
    subscription: true,
    dataset: 'e663eb09-04de-4f39-b871-35c6c2ed10b5',
    layers: ['dd5df87f-39c2-4aeb-a462-3ef969b20b66']
}, {
    name: 'umd_as_it_happens_idn',
    slug: 'glad-alerts',
    subscription: true,
    dataset: 'e663eb09-04de-4f39-b871-35c6c2ed10b5',
    layers: ['dd5df87f-39c2-4aeb-a462-3ef969b20b66']
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
        for (let i = 0, length = LAYERS.length; i < length; i++) {
            if (LAYERS[i].slug === slug) {
                return LAYERS[i];
            }
        }
        return null;
    }

}

module.exports = Layer;
