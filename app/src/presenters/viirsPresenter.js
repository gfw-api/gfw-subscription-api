'use strict';

class VIIRSPresenter {

  static transform(results, layer) {
    results.value = results.value + ' fires';
    return results;
  }

}

module.exports = VIIRSPresenter;
