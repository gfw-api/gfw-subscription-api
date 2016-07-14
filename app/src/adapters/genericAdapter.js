'use strict';

var logger = require('logger');

class GenericAdapter {

  constructor(results) {
    this.results = results;
  }

  transform() {
    return {
      value: this.results.value
    };
  }

}

module.exports = GenericAdapter;
