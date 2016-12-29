'use strict';

var logger = require('logger');
var config = require('config');
var UrlService = require('services/urlService');

const DOMAIN_IMAGE = 'http://gfw2stories.s3.amazonaws.com/uploads/';

var searchImage = function(story){
  if (story.media){
    for (let i= 0, length = story.media.length; i < length; i++) {
      if (story.media[i].mimeType && story.media[i].url){
        return DOMAIN_IMAGE + story.media[i].url;
      }
    }
  }
  return null;
}

class StoryAdapter {

  constructor(results) {
    this.results = results;
  }

  transform() {
    let stories = [];
    if (this.results && this.results.length > 0) {
      for (let i = 0, length = this.results.length; i < length; i++) {
        stories.push({
          title: this.results[i].title,
          description: this.results[i].description.substring(0, 350),
          url: UrlService.flagshipUrl('/stories/'+this.results[i].id),
          image: searchImage(this.results[i])
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
