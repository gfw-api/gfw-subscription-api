'use strict';

class AnalysisClassifier {

  static pathFor(subscription) {
    let params = subscription.params || {};

    if (params.iso) {
      let url = '/admin/' + params.iso.country;

      if (params.iso.region) {
        url += '/' + params.iso.region;
      }

      return url;
    }

    if (params.use && params.useid) {
      return '/use/' + params.use + '/' + params.useid;
    }

    if (params.wdpa) {
      return '/wdpa/' + params.wdpa;
    }

    return '/';
  }

}

module.exports = AnalysisClassifier;
