import logger from 'logger';
import { RWAPIMicroservice } from 'rw-api-microservice-node';

import LastUpdate, { ILastUpdate } from 'models/lastUpdate';
import { Deserializer } from 'jsonapi-serializer';

export interface UpdateServiceResponse {
    beginDate?: Date,
    endDate?: Date,
    updated: boolean
}

class UpdateService {

    static async checkUpdated(dataset: string): Promise<UpdateServiceResponse> {
        logger.info(`Checking if dataset ${dataset} was updated`);
        try {
            const result: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
                uri: `/v1/${dataset}/latest`,
                method: 'GET',
                json: true
            });

            const latest: Record<string, any> = await new Deserializer({
                keyForAttribute: 'camelCase'
            }).deserialize(result);
            logger.debug('Obtaining last updated');
            const lastUpdated: ILastUpdate = await LastUpdate.findOne({ dataset }).exec();
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

export default UpdateService;
