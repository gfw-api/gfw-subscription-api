'use strict';

class ImazonPresenter {

  static * transform(results, layer, subscription) {
    results.alert_count = results.value;
    return results;
  }

}

module.exports = ImazonPresenter;
