import { RWAPIMicroservice } from 'rw-api-microservice-node';

class AreaService {

    static async getUserArea(areaId: Number): Promise<Record<string, any>> {
        const body: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
            uri: `/v2/area/${areaId}`,
            method: 'GET'
        });
 
        return body.data;
    }
}

export default AreaService;
