'use strict';

var logger = require('logger');

class Forma250Adapter {

    constructor(results) {
        this.results = results;
    }

    transform() {
        return {
            value: this.results.alertCounts
        };
    }

}

module.exports = Forma250Adapter;
