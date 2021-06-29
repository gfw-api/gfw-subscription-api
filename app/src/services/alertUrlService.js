const config = require('config');
const btoa = require('btoa');

const BASE_URL = config.get('gfw.flagshipUrl');
const GADM36_DATASET = config.get('layers.gadm36BoundariesDataset');
const GADM36_LAYER_1 = config.get('layers.gadm36BoundariesLayer1');
const GADM36_LAYER_2 = config.get('layers.gadm36BoundariesLayer2');

const qs = require('qs');
const moment = require('moment');

const encodeStateForUrl = (state) => btoa(JSON.stringify(state));

class AlertUrlService {

    static getPrimaryForestDataset() {
        return {
            dataset: 'primary-forests',
            opacity: 1,
            visibility: true,
            layers: ['primary-forests-2001']
        };
    }

    static getIntactForestDataset() {
        return {
            dataset: 'intact-forest-landscapes',
            opacity: 1,
            visibility: true,
            layers: ['intact-forest-landscapes'],
        };
    }

    static getPeatlandsDatasets() {
        return [{
            dataset: 'malaysia-peat-lands',
            opacity: 1,
            visibility: true,
            layers: ['malaysia-peat-lands-2004'],
            iso: 'MYS'
        },
        {
            dataset: 'indonesia-forest-moratorium',
            opacity: 1,
            visibility: true,
            layers: ['indonesia-forest-moratorium'],
            iso: 'IDN'
        },
        {
            dataset: 'indonesia-peat-lands',
            opacity: 1,
            visibility: true,
            layers: ['indonesia-peat-lands-2012'],
            iso: 'IDN'
        }];
    }

    static getWDPADataset() {
        return {
            dataset: 'wdpa-protected-areas',
            opacity: 1,
            visibility: true,
            layers: ['wdpa-protected-areas'],
        };
    }

    static getEncodedQueryForSubscription(datasets, subscription) {
        const queryForUrl = {
            lang: subscription.language || 'en',
            map: encodeStateForUrl({ canBound: true, datasets }),
            mainMap: encodeStateForUrl({ showAnalysis: true }),
        };

        return qs.stringify(queryForUrl);
    }

    static processLayer(layer, begin, end) {
        const diffInDays = moment(begin).diff(moment(end), 'days');
        return {
            dataset: layer.datasetId,
            layers: [layer.layerId],
            timelineParams: {
                startDateAbsolute: moment(begin).format('YYYY-MM-DD'),
                endDateAbsolute: moment(end).format('YYYY-MM-DD'),
                startDate: moment(begin).format('YYYY-MM-DD'),
                endDate: moment(end).format('YYYY-MM-DD'),
                trimEndDate: moment(end).format('YYYY-MM-DD'),
            },
            ...layer.slug === 'viirs-active-fires' && {
                params: { number_of_days: diffInDays <= 7 ? diffInDays : 7 }
            },
        };
    }

    static generate(subscription, layer, begin, end) {
        const queryForUrl = {
            lang: subscription.language || 'en',
            map: encodeStateForUrl({
                canBound: true,
                datasets: [AlertUrlService.processLayer(layer, begin, end)]
                    .concat([{
                        dataset: GADM36_DATASET,
                        layers: [GADM36_LAYER_1, GADM36_LAYER_2]
                    }]),
            }),
            mainMap: encodeStateForUrl({ showAnalysis: true }),
        };

        return `${BASE_URL}/map/aoi/${subscription.id}?${qs.stringify(queryForUrl)}`;
    }

    static generateForManyLayers(subscription, layers, begin, end) {
        const queryForUrl = {
            lang: subscription.language || 'en',
            map: encodeStateForUrl({
                canBound: true,
                datasets: layers
                    .map((layer) => AlertUrlService.processLayer(layer, begin, end))
                    .concat([{ dataset: GADM36_DATASET, layers: [GADM36_LAYER_1, GADM36_LAYER_2] }]),
            }),
            mainMap: encodeStateForUrl({ showAnalysis: true }),
        };

        return `${BASE_URL}/map/aoi/${subscription.id}?${qs.stringify(queryForUrl)}`;
    }

    static generatePrimaryForestMapURL(subscription, layer, begin, end) {
        const query = AlertUrlService.getEncodedQueryForSubscription([
            AlertUrlService.processLayer(layer, begin, end),
            AlertUrlService.getPrimaryForestDataset(),
        ], subscription);

        return `${BASE_URL}/map/aoi/${subscription.id}?${query}`;
    }

    static generateIntactForestMapURL(subscription, layer, begin, end) {
        const query = AlertUrlService.getEncodedQueryForSubscription([
            AlertUrlService.processLayer(layer, begin, end),
            AlertUrlService.getIntactForestDataset(),
        ], subscription);

        return `${BASE_URL}/map/aoi/${subscription.id}?${query}`;
    }

    static generateWDPAMapURL(subscription, layer, begin, end) {
        const query = AlertUrlService.getEncodedQueryForSubscription([
            AlertUrlService.processLayer(layer, begin, end),
            AlertUrlService.getWDPADataset(),
        ], subscription);

        return `${BASE_URL}/map/aoi/${subscription.id}?${query}`;
    }

    static generatePeatMapURL(subscription, layer, begin, end) {
        const query = AlertUrlService.getEncodedQueryForSubscription([
            AlertUrlService.processLayer(layer, begin, end),
            ...AlertUrlService.getPeatlandsDatasets(),
        ], subscription);

        return `${BASE_URL}/map/aoi/${subscription.id}?${query}`;
    }

}

module.exports = AlertUrlService;
