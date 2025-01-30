import { RWAPIMicroservice } from 'rw-api-microservice-node';

import config from "config";

class AreaService {

    static async getUserArea(areaId: Number): Promise<Record<string, any>> {
        const body: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
            uri: `/v2/area/${areaId}?source[provider]=gadm&source[version]=${config.get('settings.gadmVersion')}`,
            method: 'GET'
        });
 
        return body.data;
    }
}

export default AreaService;
