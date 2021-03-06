const config = require('config');

const LAYERS = [{
    name: 'loss',
    slug: 'umd-loss-gain',
    subscription: true,
    datasetId: config.get('layers.umdLossGainLayerDataset'),
    layerId: config.get('layers.umdLossGainLayer')
}, {
    // no longer on flagship
    name: 'guyra',
    slug: 'guira-loss',
    subscription: true
}, {
    name: 'viirs_fires_alerts',
    slug: 'viirs-active-fires',
    subscription: true,
    datasetId: config.get('layers.viirsLayerDataset'),
    layerId: config.get('layers.viirsLayer')
}, {
    name: 'umd_as_it_happens',
    slug: 'glad-alerts',
    subscription: true,
    datasetId: config.get('layers.gladAlertLayerDataset'),
    layerId: config.get('layers.gladAlertLayer')
}, {
    name: 'umd_as_it_happens_per',
    slug: 'glad-alerts',
    subscription: true,
    datasetId: config.get('layers.gladAlertLayerDataset'),
    layerId: config.get('layers.gladAlertLayer')
}, {
    name: 'umd_as_it_happens_cog',
    slug: 'glad-alerts',
    subscription: true,
    datasetId: config.get('layers.gladAlertLayerDataset'),
    layerId: config.get('layers.gladAlertLayer')
}, {
    name: 'umd_as_it_happens_idn',
    slug: 'glad-alerts',
    subscription: true,
    datasetId: config.get('layers.gladAlertLayerDataset'),
    layerId: config.get('layers.gladAlertLayer')
}, {
    name: 'monthly-summary',
    slug: 'monthly-summary',
    subscription: true,
    datasetId: config.get('layers.viirsLayerDataset'),
    layerId: config.get('layers.viirsLayer')
}];

class Layer {

    static findBySlug(slug) {
        for (let i = 0, { length } = LAYERS; i < length; i++) {
            if (LAYERS[i].slug === slug) {
                return LAYERS[i];
            }
        }
        return null;
    }

}

module.exports = Layer;
