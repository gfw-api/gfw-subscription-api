import { Serializer } from 'jsonapi-serializer';


const subscriptionSerializer: Serializer = new Serializer('subscription', {
    attributes: [
        'name', 'createdAt', 'userId', 'geostoreId',
        'resource', 'datasets', 'params', 'confirmed', 'language', 'datasetsQuery', 'env'
    ],

    resource: {
        attributes: ['type', 'content']
    },

    params: {
        attributes: ['iso', 'id1', 'wdpaid', 'use', 'useid', 'geostore', 'area', 'geostoreDataApi']
    },

    typeForAttribute: (attribute: string) => attribute,
    keyForAttribute: 'camelCase'
});

export interface SerializedSubscription {
    name: string,
    createdAt: string,
    userId: string,
    geostoreId: string,
    resource: {
        type: string
        content: string
    },
    datasets: string[],
    params: {
        iso: string,
        id1: string,
        wdpaid: string,
        use: string,
        useid: string,
        geostore: string,
        area: string,
        geostoreDataApi: string
    },
    confirmed: string,
    language: string,
    datasetsQuery: string,
    env: string
}

export interface SerializedSubscriptionResponse {
    data: {
        id: string,
        type: "subscription",
        attributes: SerializedSubscription
    },
    links: {
        self: string,
        first: string,
        last: string,
        prev: string,
        next: string,
    },
    meta: {
        'total-pages': number,
        'total-items': number
        size: number
    }
}

class SubscriptionSerializer {

    static serializeList(data: Record<string, any>, link: string): SerializedSubscriptionResponse {
        const serializedData: SerializedSubscriptionResponse = subscriptionSerializer.serialize(data.docs);

        serializedData.links = {
            self: `${link}page[number]=${data.page}&page[size]=${data.limit}`,
            first: `${link}page[number]=1&page[size]=${data.limit}`,
            last: `${link}page[number]=${data.pages}&page[size]=${data.limit}`,
            prev: `${link}page[number]=${data.page - 1 > 0 ? data.page - 1 : data.page}&page[size]=${data.limit}`,
            next: `${link}page[number]=${data.page + 1 < data.pages ? data.page + 1 : data.pages}&page[size]=${data.limit}`,
        };

        serializedData.meta = {
            'total-pages': data.pages,
            'total-items': data.total,
            size: data.limit
        };

        return serializedData;
    }

    static serialize(data: Record<string, any>): SerializedSubscriptionResponse {
        return subscriptionSerializer.serialize(data);
    }

}

export default SubscriptionSerializer;
