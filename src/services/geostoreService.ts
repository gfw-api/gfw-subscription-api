import logger from 'logger';
import { RWAPIMicroservice } from 'rw-api-microservice-node';

class GeostoreService {

    /**
     * @todo these params come from the subscription model. we should try to determine if those could be typed
     * properly, so we have additional data integrity.
     */
    static async getGeostoreIdFromSubscriptionParams(params: Record<string, any>): Promise<string> {
        if (params.geostore) {
            return params.geostore;
        }

        if (params.wdpaid) {
            return GeostoreService.getGeostoreFromWDPAID(params.wdpaid);
        }

        if (params.iso && params.iso.country && params.iso.region && params.iso.subregion) {
            return GeostoreService.getGeostoreFromISOSubregionCode(params.iso.country, params.iso.region, params.iso.subregion);
        }

        if (params.iso && params.iso.country && params.iso.region) {
            return GeostoreService.getGeostoreFromISORegionCode(params.iso.country, params.iso.region);
        }

        if (params.iso && params.iso.country) {
            return GeostoreService.getGeostoreFromISOCountryCode(params.iso.country);
        }

        if (params.use && params.useid) {
            return GeostoreService.getGeostoreFromUseId(params.use, params.useid);
        }

        logger.error('Could not find geostore for the params of the provided subscription.', params);
        throw new Error('Could not find geostore for the params of the provided subscription.');
    }

    static async getGeostoreFromISOCountryCode(countryCode: string): Promise<string> {
        const uri: string = `/v2/geostore/admin/${countryCode}`;
        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
            uri,
            method: 'GET',
            json: true,
        });
        return response.data.id;
    }

    static async getGeostoreFromISORegionCode(countryCode: string, regionCode: string): Promise<string> {
        const uri: string = `/v2/geostore/admin/${countryCode}/${regionCode}`;
        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
            uri,
            method: 'GET',
            json: true,
        });
        return response.data.id;
    }

    static async getGeostoreFromISOSubregionCode(countryCode: string, regionCode: string, subregionCode: string): Promise<string> {
        const uri: string = `/v2/geostore/admin/${countryCode}/${regionCode}/${subregionCode}`;
        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
            uri,
            method: 'GET',
            json: true,
        });
        return response.data.id;
    }

    static async getGeostoreFromWDPAID(wdpaId: string): Promise<string> {
        const uri: string = `/v2/geostore/wdpa/${wdpaId}`;
        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
            uri,
            method: 'GET',
            json: true
        });
        return response.data.id;
    }

    static async getGeostoreFromUseId(use: string, useId: string): Promise<string> {
        const uri: string = `/v2/geostore/use/${use}/${useId}`;
        const response: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
            uri,
            method: 'GET',
            json: true,
        });
        return response.data.id;
    }

}

export default GeostoreService;
