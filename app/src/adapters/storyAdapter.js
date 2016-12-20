'use strict';

var logger = require('logger');
var config = require('config');
var UrlService = require('services/urlService');

class StoryAdapter {

  constructor(results) {
    this.results = results;
  }

  transform() {
    let stories = [];
    if (this.results && this.results.length > 0) {
      for (let i = 0, length = this.results.length; i < length; i++) {
        stories.push({
          name: this.results[i].name,
          url: UrlService.flagshipUrl('/stories/'+this.results[i].id)
        });
      }
    }

    return {
      list: this.results,
      value: this.results.length,
      stories: stories
    };
  }

}

module.exports = StoryAdapter;
