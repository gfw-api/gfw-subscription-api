'use strict';

var _ = require('lodash');

const GENERIC_ADAPTER = require('adapters/genericAdapter');
const ADAPTER_MAP = {
};

class AnalysisResultsAdapter {

  static transform(results, layer) {
    let Adapter = ADAPTER_MAP[layer.slug] || GENERIC_ADAPTER,
        adapter = new Adapter(results);

    return adapter.transform();
  }

  static isZero(results) {
    if (_.isArray(results.value)) {
      return _.filter(
        results.value,
        function(n) {
            if(_.isObject(n)){
                return n.value > 0;
            }
            return n > 0;
        }
      ).length === 0;
    } else {
      return results.value === 0;
    }
  }

}

module.exports = AnalysisResultsAdapter;
