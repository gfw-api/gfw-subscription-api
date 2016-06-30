'use strict';

class AnalysisClassifier {

  static pathFor(subscription) {
    let params = subscription.params || {};

    if (params.iso) {
      let url = '/admin/' + params.iso;

      if (params.id1) {
        url += '/' + params.id1;
      }

      return url;
    }

    if (params.use) {
      return '/use/' + params.use.name + '/' + params.use.id;
    }

    if (params.wdpa_id) {
      return '/wdpa/' + params.wdpa_id;
    }

    return '/';
  }

}

module.exports = AnalysisClassifier;
