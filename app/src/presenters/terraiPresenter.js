'use strict';
var logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');

class TerraiPresenter {

  static * transform(results, layer, subscription) {
    results.alert_count = results.value;
    let uri = '/query' + results.downloadUrls.csv.split('download')[1];
    const geostore =  /geostore=([a-z0-9]*)/g.exec(uri)[1];
    uri = uri.split('&format')[0].replace('ORDER BY year, day', ' order by day desc, year desc limit 10&geostore=') + geostore;

    logger.info('Last alerts endpoint ', uri);

    try {
      let alerts = yield ctRegisterMicroservice.requestToMicroservice({
          uri: uri,
          method: 'GET',
          json: true
      });
      results.alerts = alerts.data.map(el => {
        el.date = new Date(new Date(el.year, 0, 1).getTime() + el.day*24*3600*1000);
        return el;
      });
    } catch (err) {
      logger.error(err);
      //throw(err);
      results.alerts = [];
    }
    logger.info('Terrai P Results ', results);
    
    return results;
  }

}

module.exports = TerraiPresenter;
