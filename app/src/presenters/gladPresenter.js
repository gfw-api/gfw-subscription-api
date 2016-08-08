'use strict';

class GLADPresenter {

  static * transform(results, layer, subscription) {
    results.alert_count = results.value;
    return results;
  }

}

module.exports = GLADPresenter;
