'use strict';

var VIIRSPresenter = require('presenters/viirsPresenter'),
    GLADPresenter  = require('presenters/gladPresenter');

const PRESENTER_MAP = {
  'viirs-active-fires': VIIRSPresenter,
  'glad-alerts': GLADPresenter
};

const decorateWithConfig = function(results) {
  return results;
};

class AnalysisResultsPresenter {
  static decorateWithConfig(results, layer) {
    return results;
  }

  static render(results, layer) {
    let Presenter = PRESENTER_MAP[layer.slug];

    if (Presenter) {
      results = Presenter.transform(results, layer);
    }

    return this.decorateWithConfig(results);
  }
}

module.exports = AnalysisResultsPresenter;
