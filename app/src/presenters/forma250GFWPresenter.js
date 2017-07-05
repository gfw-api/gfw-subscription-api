'use strict';

class Forma250GFWPresenter {

  static * transform(results, layer, subscription) {
    results.alert_count = results.alertCounts;

    

    return results;
  }

}

module.exports = Forma250GFWPresenter;
