'use strict';
var logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');

class GLADPresenter {

  static * transform(results, layer, subscription) {
    results.alert_count = results.value;
    let uri = results.downloadUrls.csv.replace('download', 'query').split('&format')[0];
    uri = uri.replace('&geostore', ' order by julian_day desc, year desc limit 10&geostore');

    try {
      let alerts = yield ctRegisterMicroservice.requestToMicroservice({
          uri: uri,
          method: 'GET',
          json: true
      });
      results.alerts = alerts.data;
    } catch (err) {
      logger.error(err);
      throw(err);
    }
    return results;
  }

}

module.exports = GLADPresenter;
