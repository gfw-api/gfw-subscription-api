const logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const LastUpdate = require('models/lastUpdate');
const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;

class UpdateService {

    static async checkUpdated(dataset) {
        logger.info(`Checking if dataset ${dataset} was updated`);
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri: `/${dataset}/latest`,
                method: 'GET',
                json: true
            });

            const latest = await new JSONAPIDeserializer({
                keyForAttribute: 'camelCase'
            }).deserialize(result);
            logger.debug('Obtaining last updated');
            const lastUpdated = await LastUpdate.findOne({ dataset }).exec();
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
            await LastUpdate.update({ dataset }, { date: latest[0].date }).exec();

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
