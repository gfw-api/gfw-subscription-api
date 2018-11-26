const getUUID = () => Math.random().toString(36).substring(7);

const createSubscription = (userId) => {
    const uuid = getUUID();
    const datasetUuid = getUUID();

    return {
        name: `Widget ${uuid}`,
        datasets: [ datasetUuid ],
        userId: userId,
        application: 'rw',
        env: 'production',
    };
};

module.exports = {
    createSubscription,
    getUUID
};
