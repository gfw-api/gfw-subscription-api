const JSONAPISerializer = require('jsonapi-serializer').Serializer;

const subscriptionSerializer = new JSONAPISerializer('subscription', {
    attributes: [
        'name', 'createdAt', 'userId', 'geostoreId',
        'resource', 'datasets', 'params', 'confirmed', 'language', 'datasetsQuery', 'env'
    ],

    resource: {
        attributes: ['type', 'content']
    },

    datasets: {
        attributes: ['name', 'params']
    },

    params: {
        attributes: ['iso', 'id1', 'wdpaid', 'use', 'useid', 'geostore', 'area']
    },

    typeForAttribute(attribute) {
        return attribute;
    },
    keyForAttribute: 'camelCase'
});

class SubscriptionSerializer {

    static serializeList(data, link) {
        const serializedData = subscriptionSerializer.serialize(data.docs);

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

    static serialize(data) {
        return subscriptionSerializer.serialize(data);
    }

}

module.exports = SubscriptionSerializer;
