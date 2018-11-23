'use strict';
const logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');

class TerraiPresenter {

    static* transform(results, layer, subscription) {
        results.alert_count = results.value;
        let uri = '/query' + results.downloadUrls.csv.split('download')[1];
        uri = uri.replace('ORDER BY year, day', ' ORDER BY day DESC, year DESC LIMIT 10').replace(/&format=(csv|json|xml)/g, '');

        logger.info('Last alerts endpoint ', uri);
        try {
            let alerts = yield ctRegisterMicroservice.requestToMicroservice({
                uri: uri,
                method: 'GET',
                json: true
            });
            results.alerts = alerts.data.map(el => {
                const date = new Date(new Date(el.year, 0, 1).getTime() + el.day * 24 * 3600 * 1000)
                    .toISOString()
                    .split('T');
                return {
                    acq_date: date[0],
                    acq_time: date[1].substr(0, 8),
                    latitude: el.lat,
                    longitude: el.long
                };
            });
        } catch (err) {
            logger.error(err);
            results.alerts = [];
        }
        logger.info('Terrai P Results ', results);

        return results;
    }

}

module.exports = TerraiPresenter;
