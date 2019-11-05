const logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const LastUpdate = require('models/lastUpdate');
const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;

const deserializer = function (obj) {
    return function (callback) {
        new JSONAPIDeserializer({ keyForAttribute: 'camelCase' }).deserialize(obj, callback);
    };
};

class UpdateService {
    static* checkUpdated(dataset) {
        logger.info(`Checking if dataset ${dataset} was updated`);
        try {
            let result = yield ctRegisterMicroservice.requestToMicroservice({
                uri: `/${dataset}/latest`,
                method: 'GET',
                json: true
            });

            let latest = yield deserializer(result);
            logger.debug('Obtaining last updated');
            let lastUpdated = yield LastUpdate.findOne({ dataset: dataset }).exec();
            logger.debug('Last updated', lastUpdated);

            if (!lastUpdated || new Date(lastUpdated.date) >= new Date(latest[0].date)) {
                if (lastUpdated) {
                    logger.info(`Dataset ${dataset} was not updated (last sent date ${lastUpdated.date} and latest date ${latest[0].date})`);
                } else {
                    logger.info(`Dataset ${dataset} was not updated`);
                }
                return {
                    updated: false
                };
            }

            logger.debug('Saving lastupdates', dataset, latest[0].date);
            yield LastUpdate.update({ dataset: dataset }, { date: latest[0].date }).exec();

            return {
                beginDate: lastUpdated.date,
                endDate: latest[0].date,
                updated: true
            };
        } catch (e) {
            logger.error('Error to obtain latest endpoint', e);
            return {
                updated: false
            };
        }

    }
}

module.exports = UpdateService;
