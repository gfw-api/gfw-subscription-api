const logger = require('logger');
const imageService = require('services/imageService');
const analysisService = require('services/analysisService');


class VIIRSPresenter {

    static* transform(results, layer, subscription, begin, end) {
        logger.debug('Obtaining fires');
        let alerts = yield analysisService.execute(subscription, layer.slug, begin, end, true);
        if (alerts && alerts.length && alerts.length > 0) {
            let alertsFormat = [];
            let length = 10;
            if (alerts.length < 10) {
                length = alerts.length;
            }
            for (let i = 0; i < length; i++) {
                try {
                    alertsFormat.push({
                        acq_date: alerts[i].acqDate.split('T')[0],
                        acq_time: `${alerts[i].acqTime.substr(0, 2)}:${alerts[i].acqTime.substr(2, 4)}`,
                        latitude: alerts[i].latitude,
                        longitude: alerts[i].longitude
                    });
                } catch (err) {
                    logger.error(err);
                    throw err;
                }
            }
            logger.debug('Alerts formatted', alertsFormat);
            results.alerts = alertsFormat;
        }
        results.alert_count = results.value;
        results.map_image = yield imageService.overviewImage(subscription, layer.slug, begin, end);
        return results;
    }

}

module.exports = VIIRSPresenter;
