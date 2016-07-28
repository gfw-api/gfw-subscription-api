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

const iso = function(subscription) {
  let params = subscription.params || {};

  if (params.iso) {
    let iso = params.iso.country;

    if (params.iso.region) {
      iso += `-${params.iso.region}`;
    }

    return iso;
  } else {
    return 'ALL';
  }
};

class AlertUrlService {

  static generate(subscription, layer, begin, end) {
    let query = {
      begin: moment(begin).format('YYYY-MM-DD'),
      end: moment(end).format('YYYY-MM-DD'),
      geostore: subscription.params.geostore
    };

    let existingUrlParams = _.pick(subscription.params, ALLOWED_PARAMS);
    query = _.omitBy(Object.assign(query, existingUrlParams), _.isNil);

    let baselayer = layer.slug,
        querystring = qs.stringify(query);

    return `${BASE_URL}/map/3/0/0/${iso(subscription)}/grayscale/${baselayer}?${querystring}`;
  }

}

module.exports = AlertUrlService;
