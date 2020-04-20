const config = require('config');

const BASE_URL = config.get('gfw.flagshipUrl');

const qs = require('querystring');
const moment = require('moment');
const _ = require('lodash');

const ALLOWED_PARAMS = [
    'tab', 'geojson', 'geostore', 'wdpaid', 'begin', 'end', 'threshold',
    'dont_analyze', 'hresolution', 'tour', 'subscribe', 'use', 'useid',
    'fit_to_geom'
];

const getIso = (subscription) => {
    const params = subscription.params || {};

    if (params.iso && params.iso.country) {
        let iso = params.iso.country;

        if (params.iso.region) {
            iso += `-${params.iso.region}`;
        }

        return iso;
    }
    return 'ALL';

};

class AlertUrlService {

    static generate(subscription, layer, begin, end) {
        let query = {
            begin: moment(begin).format('YYYY-MM-DD'),
            end: moment(end).format('YYYY-MM-DD'),
            fit_to_geom: true
        };
        let iso = getIso(subscription);

        if (subscription.params.geostore) {
            query.geostore = subscription.params.geostore;
        }
        if (subscription.params.use) {
            query.use = subscription.params.use;
            query.useid = subscription.params.useid;
            iso = 'ALL';
        }
        if (subscription.params.wdpaid) {
            query.wdpaid = subscription.params.wdpaid;
            iso = 'ALL';
        }

        if (subscription.language) {
            query.lang = subscription.language;
        }

        const existingUrlParams = _.pick(subscription.params, ALLOWED_PARAMS);
        query = _.omitBy(Object.assign(query, existingUrlParams), _.isNil);

        const baselayer = layer.name;
        const querystring = qs.stringify(query);

        return `${BASE_URL}/map/3/0/0/${iso}/grayscale/${baselayer}?${querystring}`;
    }

}

module.exports = AlertUrlService;
