'use strict';
const logger = require('logger');
const analysisService = require('services/analysisService');

class FormaPresenter {

  static * transform(results, layer, subscription, begin, end) {
    let alerts = yield analysisService.execute(subscription, layer.slug, begin, end, true);
    if (alerts && alerts.length && alerts.length > 0) {
      let alertsFormat = [];
      let length = 10;
      if (alerts.length < 10) {
        length = alerts.length;
      }
      for (let i = 0; i < length; i++) {
        try {
          const date = alerts[i].acqDate.split('T');
          alertsFormat.push({
            acq_date: date[0],
            acq_time: date[1].substr(0, 8),
            latitude: alerts[i].latitude,
            longitude: alerts[i].longitude
          });
        } catch(err) {
          logger.error(err);
          throw err;
        }
      }
      results.alerts = alertsFormat;
    }

    results.alert_count = results.value;
    return results;
  }
}

module.exports = FormaPresenter;
