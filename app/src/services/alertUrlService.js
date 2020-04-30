const config = require('config');
const btoa = require('btoa');

const BASE_URL = config.get('gfw.flagshipUrl');
const GADM36_DATASET = config.get('layers.gadm36BoundariesDataset');
const GADM36_LAYER_1 = config.get('layers.gadm36BoundariesLayer1');
const GADM36_LAYER_2 = config.get('layers.gadm36BoundariesLayer2');

const qs = require('qs');
const moment = require('moment');

const endocdeStateForUrl = (state) => btoa(JSON.stringify(state));

class AlertUrlService {

    static generate(subscription, layer, begin, end) {
        const diffInDays = moment(begin).diff(moment(end), 'days');

        const queryForUrl = {
            lang: subscription.language || 'en',
            map: endocdeStateForUrl({
                canBound: true,
                ...layer.datasetId && layer.layerId && {
                    datasets: [
                        {
                            dataset: layer.datasetId,
                            layers: [layer.layerId],
                            ...layer.slug === 'viirs-active-fires' && {
                                params: {
                                    number_of_days: diffInDays <= 7 ? diffInDays : 7
                                }
                            },
                            ...layer.slug !== 'viirs-active-fires' && {
                                timelineParams: {
                                    startDate: moment(begin).format('YYYY-MM-DD'),
                                    endDate: moment(end).format('YYYY-MM-DD'),
                                    trimEndDate: moment(end).format('YYYY-MM-DD')
                                }
                            }
                        },
                        {
                            dataset: GADM36_DATASET,
                            layers: [GADM36_LAYER_1, GADM36_LAYER_2]
                        }
                    ]
                }
            }),
            mainMap: endocdeStateForUrl({
                showAnalysis: true
            })
        };

        return `${BASE_URL}/map/aoi/${subscription.id}?${qs.stringify(queryForUrl)}`;
    }

}

module.exports = AlertUrlService;
