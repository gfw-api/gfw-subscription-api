const getUUID = () => Math.random().toString(36).substring(7);

const createSubscription = (userId, datasetUuid = null) => {
    const uuid = getUUID();

    return {
        name: `Subscription ${uuid}`,
        datasets: [datasetUuid || getUUID()],
        userId,
        application: 'rw',
        env: 'production',
        confirmed: true,
        params: {
            geostore: 'agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw'
        },
        resource: {
            content: 'subscription-receipient@vizzuality.com',
            type: 'EMAIL'
        }
    };
};

module.exports = {
    createSubscription,
    getUUID
};
