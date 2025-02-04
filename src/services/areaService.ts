import { RWAPIMicroservice } from 'rw-api-microservice-node';
import config from "config";

class AreaService {

    static async getUserArea(areaId: Number): Promise<Record<string, any>> {
        const body: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
            uri: `/v2/area/${areaId}`,
            params: { 'source[provider]': 'gadm', 'source[version]': config.get('dataApi.gadmVersion') },
            method: 'GET'
        });
 
        return body.data;
    }
}

export default AreaService;
