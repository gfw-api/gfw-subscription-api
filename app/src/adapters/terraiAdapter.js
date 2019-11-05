var logger = require('logger');
var config = require('config');
const BASE_URL_API = config.get('gfw.apiUrl');

class TerraiAdapter {

    constructor(results) {
        this.results = results;
    }

    transform() {
        return {
            value: this.results.value,
            downloadUrls: {
                csv: `${BASE_URL_API}${this.results.downloadUrls.csv}`,
                json: `${BASE_URL_API}${this.results.downloadUrls.json}`
            }
        };
    }

}

module.exports = TerraiAdapter;
