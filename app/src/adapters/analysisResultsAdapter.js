'use strict';

var _ = require('lodash');

const GENERIC_ADAPTER = require('adapters/genericAdapter');
const GladAdapter = require('adapters/gladAdapter');
const StoryAdapter = require('adapters/storyAdapter');
const Forma250Adapter = require('adapters/forma250Adapter');
const TerraiAdapter = require('adapters/terraiAdapter');
const ADAPTER_MAP = {
  'glad-alerts': GladAdapter,
  'story': StoryAdapter,
  'forma250GFW': Forma250Adapter,
  'terrai-alerts': TerraiAdapter
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
      return !results.value;
    }
  }

}

module.exports = AnalysisResultsAdapter;
