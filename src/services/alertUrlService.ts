import config from 'config';
import qs from 'qs';
import moment from 'moment';
import { ISubscription } from 'models/subscription';
import { ILayer } from 'models/layer';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import btoa from 'btoa';

const BASE_URL: string = config.get('gfw.flagshipUrl');
const GADM36_DATASET: string = config.get('layers.gadm36BoundariesDataset');
const GADM36_LAYER_1: string = config.get('layers.gadm36BoundariesLayer1');
const GADM36_LAYER_2: string = config.get('layers.gadm36BoundariesLayer2');

export interface Dataset {
    dataset: string
    opacity?: number
    visibility?: boolean
    layers: string[]
    iso?: string
    timelineParams?: {
        startDateAbsolute: string,
        endDateAbsolute: string,
        startDate: string
        endDate: string
        trimEndDate: string
    }
    params?: { number_of_days: number }
}

function encodeStateForUrl(state: Record<string, any>): string {
    return btoa(JSON.stringify(state));
}

class AlertUrlService {

    static getPrimaryForestDataset(): Dataset {
        return {
            dataset: 'primary-forests',
            opacity: 1,
            visibility: true,
            layers: ['primary-forests-2001']
        };
    }

    static getIntactForestDataset(): Dataset {
        return {
            dataset: 'intact-forest-landscapes',
            opacity: 1,
            visibility: true,
            layers: ['intact-forest-landscapes'],
        };
    }

    static getPeatlandsDatasets(): Dataset[] {
        return [
            {
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

    static getWDPADataset(): Dataset {
        return {
            dataset: 'wdpa-protected-areas',
            opacity: 1,
            visibility: true,
            layers: ['wdpa-protected-areas'],
        };
    }

    static getEncodedQueryForSubscription(datasets: Dataset[], subscription: ISubscription): string {
        const queryForUrl: Record<string, any> = {
            lang: subscription.language || 'en',
            map: encodeStateForUrl({
                canBound: true,
                datasets,
                basemap: {
                    value: 'planet',
                    color: '',
                    name: 'latest',
                    imageType: 'analytic',
                }
            }),
            mainMap: encodeStateForUrl({ showAnalysis: true }),
        };

        return qs.stringify(queryForUrl);
    }

    static processLayer(layer: ILayer, begin: Date, end: Date): Dataset {
        const diffInDays: number = moment(begin).diff(moment(end), 'days');
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

    static generate(subscription: ISubscription, layer: ILayer, begin: Date, end: Date): string {
        const queryForUrl: Record<string, any> = {
            lang: subscription.language || 'en',
            map: encodeStateForUrl({
                canBound: true,
                datasets: [AlertUrlService.processLayer(layer, begin, end)]
                    .concat([{
                        dataset: GADM36_DATASET,
                        layers: [GADM36_LAYER_1, GADM36_LAYER_2]
                    }]),
                basemap: {
                    value: 'planet',
                    color: '',
                    name: 'latest',
                    imageType: 'analytic',
                }
            }),
            mainMap: encodeStateForUrl({ showAnalysis: true }),
        };

        return `${BASE_URL}/map/aoi/${subscription.id}?${qs.stringify(queryForUrl)}`;
    }

    static generateForManyLayers(subscription: ISubscription, layers: ILayer[], begin: Date, end: Date): string {
        const queryForUrl: {
            lang: string,
            map: string,
            mainMap: string
        } = {
            lang: subscription.language || 'en',
            map: encodeStateForUrl({
                canBound: true,
                datasets: layers
                    .map((layer: ILayer) => AlertUrlService.processLayer(layer, begin, end))
                    .concat([{ dataset: GADM36_DATASET, layers: [GADM36_LAYER_1, GADM36_LAYER_2] }]),
            }),
            mainMap: encodeStateForUrl({ showAnalysis: true }),
        };

        return `${BASE_URL}/map/aoi/${subscription.id}?${qs.stringify(queryForUrl)}`;
    }

    static generatePrimaryForestMapURL(subscription: ISubscription, layer: ILayer, begin: Date, end: Date): string {
        const query: string = AlertUrlService.getEncodedQueryForSubscription([
            AlertUrlService.processLayer(layer, begin, end),
            AlertUrlService.getPrimaryForestDataset(),
        ], subscription);

        return `${BASE_URL}/map/aoi/${subscription.id}?${query}`;
    }

    static generateIntactForestMapURL(subscription: ISubscription, layer: ILayer, begin: Date, end: Date): string {
        const query: string = AlertUrlService.getEncodedQueryForSubscription([
            AlertUrlService.processLayer(layer, begin, end),
            AlertUrlService.getIntactForestDataset(),
        ], subscription);

        return `${BASE_URL}/map/aoi/${subscription.id}?${query}`;
    }

    static generateWDPAMapURL(subscription: ISubscription, layer: ILayer, begin: Date, end: Date): string {
        const query: string = AlertUrlService.getEncodedQueryForSubscription([
            AlertUrlService.processLayer(layer, begin, end),
            AlertUrlService.getWDPADataset(),
        ], subscription);

        return `${BASE_URL}/map/aoi/${subscription.id}?${query}`;
    }

    static generatePeatMapURL(subscription: ISubscription, layer: ILayer, begin: Date, end: Date): string {
        const query: string = AlertUrlService.getEncodedQueryForSubscription([
            AlertUrlService.processLayer(layer, begin, end),
            ...AlertUrlService.getPeatlandsDatasets(),
        ], subscription);

        return `${BASE_URL}/map/aoi/${subscription.id}?${query}`;
    }

}

export default AlertUrlService;
