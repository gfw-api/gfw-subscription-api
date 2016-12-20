'use strict';

class StoryPresenter {

  static * transform(results, layer, subscription) {
    results.alert_count = results.list.length;

    

    return results;
  }

}

module.exports = StoryPresenter;
