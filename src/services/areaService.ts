import { RWAPIMicroservice } from 'rw-api-microservice-node';
import config from "config";

class AreaService {

    static async getUserArea(areaId: string): Promise<Record<string, any>> {
        const body: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
            uri: `/v2/area/${areaId}`,
            params: { 'source[provider]': 'gadm', 'source[version]': config.get('dataApi.gadmVersion') },
            method: 'GET'
        });

        return body.data.attributes;
    }

    static getIsoParams(area: Record<string, any>): Record<string, any> {
        let iso: Record<string, any> = {};
        if (area?.iso && Object.keys(area.iso).length) {
            iso = {
                country: area.iso?.country,
                region: area.iso?.region,
                subregion: area.iso?.subregion,
                source: area.iso?.source
            };
        }

        if (area?.admin && Object.keys(area.admin).length) {
            iso = {
                country: area.admin?.adm0,
                region: area.admin?.adm1,
                subregion: area.admin?.adm2,
                source: area.admin?.source
            };
        }
    
        return iso;
    }

    static getGeostoreSource(area: Record<string, any>): 'gfw' | 'rw' {
        const iso: Record<string, any> = this.getIsoParams(area);
        const geostoreSource: 'rw' | 'gfw' = (iso?.source && iso.source?.provider === 'gadm' && iso.source?.version === '4.1') ? 'gfw' : 'rw';

        return geostoreSource;
    }
}


export default AreaService;
