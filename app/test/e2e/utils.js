const getUUID = () => Math.random().toString(36).substring(7);

const createSubscription = () => {
    const uuid = getUUID();
    const datasetUuid = getUUID();

    return {
        _id: uuid,
        name: `Widget ${uuid}`,
        dataset: datasetUuid,
        userId: '1a10d7c6e0a37126611fd7a7',
        slug: `widget-${uuid}`,
        description: '',
        source: '',
        sourceUrl: 'http://foo.bar',
        authors: '',
        queryUrl: `query/${getUUID()}?sql=select * from crops`,
        freeze: false,
        published: true,
        template: false,
        defaultEditableWidget: false,
        protected: false,
        default: true,
        verified: false,
        application: [
            'rw'
        ],
        env: 'production'
    };
};

module.exports = {
    createSubscription,
    getUUID
};
