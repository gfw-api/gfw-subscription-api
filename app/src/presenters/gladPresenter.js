'use strict';
var logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');

class GLADPresenter {

  static * transform(results, layer, subscription) {
    results.alert_count = results.value;
    let uri = '/query' + results.downloadUrls.csv.split('download')[1];
    uri = uri.split('&format')[0].replace('&geostore', ' order by julian_day desc, year desc limit 10&geostore');

    logger.debug('Last alerts endpoint ', uri);

    try {
      let alerts = yield ctRegisterMicroservice.requestToMicroservice({
          uri: uri,
          method: 'GET',
          json: true
      });
      results.alerts = alerts.data.map(el => {
        el.date = new Date(new Date(el.year, 0, 1).getTime() + el.julian_day*24*3600*1000);
        return el;
      });
    } catch (err) {
      logger.error(err);
      //throw(err);
      results.alerts = [];
    }
    logger.info('Glad P Results ', results);
    return results;
  }

}

module.exports = GLADPresenter;
