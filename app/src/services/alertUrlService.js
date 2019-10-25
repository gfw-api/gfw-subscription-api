'use strict';

var config = require('config');
const BASE_URL = config.get('gfw.flagshipUrl');

var qs = require('querystring'),
    moment = require('moment'),
    _ = require('lodash');

const ALLOWED_PARAMS = [
    'tab', 'geojson', 'geostore', 'wdpaid', 'begin', 'end', 'threshold',
    'dont_analyze', 'hresolution', 'tour', 'subscribe', 'use', 'useid',
    'fit_to_geom'
];

class AlertUrlService {

    static generate(subscription, layer, begin, end) {
        let query = {
            map: {
                canBound: true,
                datasets: [
                    {
                        dataset: 'fdc8dc1b-2728-4a79-b23f-b09485052b8d',
                        layers: [
                            '6f6798e6-39ec-4163-979e-182a74ca65ee',
                            'c5d1e010-383a-4713-9aaa-44f728c0571c'
                        ],
                        boundary: true
                    },
                    {
                        dataset: layer.dataset,
                        layers: layer.layers,
                        timelineParams: {
                            startDate: moment(begin).format('YYYY-MM-DD'),
                            endDate: moment(end).format('YYYY-MM-DD'),
                            trimEndDate: moment(end).format('YYYY-MM-DD')
                        }
                    }
                ]
            },
            mainMap: {
                showAnalysis: true
            }
        };

        const existingUrlParams = _.pick(subscription.params, ALLOWED_PARAMS);
        query = _.omitBy(Object.assign(query, existingUrlParams), _.isNil);

        const querystring = qs.stringify(query);

        return `${BASE_URL}/map/aoi/${subscription.id}?${querystring}`;
    }

}

module.exports = AlertUrlService;
