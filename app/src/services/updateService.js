'use strict';

const logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');
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
        try {
          let result = yield ctRegisterMicroservice.requestToMicroservice({
              uri: `/${dataset}/latest`,
              method: 'GET',
              json: true
          });
          
          let latest = yield deserializer(result);
          logger.debug('Obtaining last updated');
          let lastUpdated = yield LastUpdate.findOne({dataset: dataset}).exec();
          logger.debug('Last updated', lastUpdated);

          if (!lastUpdated || lastUpdated.date === latest.date){
              logger.info(`Dataset ${dataset} was not updated`);
              return {
                  updated: false
              };
          }

          logger.debug('Saving lastupdates',  dataset, latest.date);
          yield LastUpdate.update({dataset: dataset},{date: latest.date} ).exec();

          return {
              beginDate: lastUpdated.date,
              endDate: latest.date,
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
