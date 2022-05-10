import {
    AlertResultWithCount,
    PresenterInterface,
} from 'presenters/presenter.interface';
import { ISubscription } from 'models/subscription';
import { ILayer } from 'models/layer';
import { BaseAlert, GenericDatasetAlert } from 'types/alertResult.type';
import { RWAPIMicroservice } from 'rw-api-microservice-node';
import { Deserializer } from 'jsonapi-serializer';
import { GenericDatasetResponseData } from 'types/presenterResponse.type';

class DatasetPresenter extends PresenterInterface<GenericDatasetAlert, GenericDatasetResponseData> {

    static #pathFor(params: Record<string, any>): string {
        if (params.iso && params.iso.country) {
            let url: string = `/admin/${params.iso.country}`;

            if (params.iso.region) {
                url += `/${params.iso.region}`;

                if (params.iso.subregion) {
                    url += `/${params.iso.subregion}`;
                }
            }

            return url;
        }

        if (params.use && params.useid) {
            return `/use/${params.use}/${params.useid}`;
        }

        if (params.wdpaid) {
            return `/wdpa/${params.wdpaid}`;
        }

        return '/';
    }

    async getAlertsForSubscription(startDate: string, endDate: string, params: Record<string, any>, layerSlug: string): Promise<BaseAlert[]> {
        const period: string = `${startDate},${endDate}`;

        const query: Record<string, any> = { period };

        if (params.geostore) {
            query.geostore = params.geostore;
        }
        const path: string = DatasetPresenter.#pathFor(params);
        const url: string = `/v1/${layerSlug}${path}`;

        const result: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
            uri: url,
            method: 'GET',
            params: query
        });

        return await new Deserializer({ keyForAttribute: 'camelCase' }).deserialize(result);
    }

    async transform(results: AlertResultWithCount<BaseAlert>, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): Promise<GenericDatasetResponseData[]> {
       return (results.data as unknown) as GenericDatasetResponseData[];
    }

}

export default new DatasetPresenter();
