const logger = require('logger');
const { RWAPIMicroservice } = require('rw-api-microservice-node');

class GeostoreService {

    static async getGeostoreIdFromSubscriptionParams(params) {
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

    static async getGeostoreFromISOCountryCode(countryCode) {
        const uri = `/v2/geostore/admin/${countryCode}`;
        const response = await RWAPIMicroservice.requestToMicroservice({
            uri,
            method: 'GET',
            json: true,
            version: false,
        });
        return response.data.id;
    }

    static async getGeostoreFromISORegionCode(countryCode, regionCode) {
        const uri = `/v2/geostore/admin/${countryCode}/${regionCode}`;
        const response = await RWAPIMicroservice.requestToMicroservice({
            uri,
            method: 'GET',
            json: true,
            version: false,
        });
        return response.data.id;
    }

    static async getGeostoreFromISOSubregionCode(countryCode, regionCode, subregionCode) {
        const uri = `/v2/geostore/admin/${countryCode}/${regionCode}/${subregionCode}`;
        const response = await RWAPIMicroservice.requestToMicroservice({
            uri,
            method: 'GET',
            json: true,
            version: false,
        });
        return response.data.id;
    }

    static async getGeostoreFromWDPAID(wdpaId) {
        const uri = `/v2/geostore/wdpa/${wdpaId}`;
        const response = await RWAPIMicroservice.requestToMicroservice({
            uri,
            method: 'GET',
            json: true,
            version: false,
        });
        return response.data.id;
    }

    static async getGeostoreFromUseId(use, useId) {
        const uri = `/v2/geostore/use/${use}/${useId}`;
        const response = await RWAPIMicroservice.requestToMicroservice({
            uri,
            method: 'GET',
            json: true,
            version: false,
        });
        return response.data.id;
    }

}

module.exports = GeostoreService;
