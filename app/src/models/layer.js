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
    subscription: true,
    datasetId: 'bfd1d211-8106-4393-86c3-9e1ab2ee1b9b',
    layerId: '8e4a527d-1bcd-4a12-82b0-5a108ffec452'
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

    static async findBySlug(slug) {
        for (let i = 0, { length } = LAYERS; i < length; i++) {
            if (LAYERS[i].slug === slug) {
                return LAYERS[i];
            }
        }
        return null;
    }

}

module.exports = Layer;
