'use strict';

const logger = require('logger');
const microserviceClient = require('vizz.microservice-client');
const LastUpdate = require('models/lastUpdate');
var JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;


var deserializer = function(obj) {
    return function(callback) {
        new JSONAPIDeserializer({keyForAttribute: 'camelCase'}).deserialize(obj, callback);
    };
};

class UpdateService {
    static * checkUpdated(dataset){
        logger.info(`Checking if dataset ${dataset} was updated`);
        let result = yield microserviceClient.requestToMicroservice({
            uri: `/${dataset}/latest`,
            method: 'GET',
            json: true
        });
        logger.debug(result);
        if (result.statusCode !== 200) {
            logger.error('Error to obtain latest endpoint', result.body);
            return {
                updated: false
            };
        }
        let latest = yield deserializer(result.body);
        logger.debug('Obtaining last updated');
        let lastUpdated = yield LastUpdate.findOne({dataset: dataset}).exec();
        logger.debug('Last updated', lastUpdated);

        if (!lastUpdated || lastUpdated.date === latest.maxDate){
            logger.info(`Dataset ${dataset} was not updated`);
            return {
                updated: false
            };
        }

        return {
            beginDate: lastUpdated.date,
            endDate: latest.maxDate,
            updated: true
        };

    }
}

module.exports = UpdateService;
