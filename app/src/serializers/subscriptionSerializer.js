
const JSONAPISerializer = require('jsonapi-serializer').Serializer;

const subscriptionSerializer = new JSONAPISerializer('subscription', {
    attributes: [
        'name', 'createdAt', 'updatedAt', 'userId', 'geostoreId',
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

    static serialize(data) {
        return subscriptionSerializer.serialize(data);
    }

}

module.exports = SubscriptionSerializer;
