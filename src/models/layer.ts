import config from 'config';

export interface ILayer {
    name: string,
    slug: string,
    subscription: boolean,
    datasetId: string,
    layerId: string
}

const LAYERS: ILayer[] = [{
    name: 'viirs-fires-alerts',
    slug: 'viirs-active-fires',
    subscription: true,
    datasetId: config.get('layers.viirsLayerDataset'),
    layerId: config.get('layers.viirsLayer')
}, {
    name: 'glad-alerts',
    slug: 'glad-alerts',
    subscription: true,
    datasetId: config.get('layers.gladAlertLayerDataset'),
    layerId: config.get('layers.gladAlertLayer')
}, {
    name: 'glad-all',
    slug: 'glad-all',
    subscription: true,
    datasetId: config.get('layers.gladAlertLayerDataset'),
    layerId: config.get('layers.gladAlertLayer')
}, {
    name: 'glad-l',
    slug: 'glad-l',
    subscription: true,
    datasetId: config.get('layers.gladAlertLayerDataset'),
    layerId: config.get('layers.gladAlertLayer')
}, {
    name: 'glad-s2',
    slug: 'glad-s2',
    subscription: true,
    datasetId: config.get('layers.gladAlertLayerDataset'),
    layerId: config.get('layers.gladAlertLayer')
}, {
    name: 'glad-radd',
    slug: 'glad-radd',
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

    static findBySlug(slug: string): ILayer | null {
        for (let i: number = 0, { length } = LAYERS; i < length; i++) {
            if (LAYERS[i].slug === slug) {
                return LAYERS[i];
            }
        }
        return null;
    }

}

export default Layer;
