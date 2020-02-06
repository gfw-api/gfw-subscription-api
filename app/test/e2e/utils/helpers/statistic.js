const { createSubInDB, createStatistic, getUUID } = require('../helpers');
const { TEST_SUBSCRIPTIONS, MOCK_USER_IDS, MOCK_USERS } = require('../test.constants');

// creating five subscriptions which are in searched range, and one which is not.
const createSubscriptions = async (outRangeDate) => {
    const subWithGeostore = await createSubInDB(MOCK_USER_IDS[0], getUUID(), TEST_SUBSCRIPTIONS[0]);
    const subWithRegion = await createSubInDB(MOCK_USER_IDS[1], getUUID(), TEST_SUBSCRIPTIONS[1]);
    const subWithCountry = await createSubInDB(MOCK_USER_IDS[2], getUUID(), TEST_SUBSCRIPTIONS[2]);
    const subWithUse = await createSubInDB(MOCK_USER_IDS[3], getUUID(), TEST_SUBSCRIPTIONS[3]);
    const subWithWdpas = await createSubInDB(MOCK_USER_IDS[4], getUUID(), TEST_SUBSCRIPTIONS[4]);
    const subOutSearchRange = await createSubInDB(MOCK_USER_IDS[5], getUUID(), { application: 'gfw', createdAt: outRangeDate });

    return {
        subWithGeostore, subWithRegion, subWithCountry, subWithUse, subWithWdpas, subOutSearchRange
    };
};

// creating two statistics which are in searched range, and one which is not.
const createStatistics = (outRangeDate) => {
    const statisticData = [
        createStatistic(),
        createStatistic(),
        createStatistic(outRangeDate)
    ];
    return Promise.all(statisticData.map((createStat) => createStat));
};

const getUserAsSingleObject = (userID) => {
    // remove last user id, because the last user hasn't subscription;
    const user = MOCK_USERS.find((_user) => _user.id === userID);
    return {

        ...user.attributes,
        id: user.id,
        createdAt: user.attributes.createdAt.toISOString()
    };
};

const createExpectedGroupStatistics = (subscriptions, actualGroupStatistic) => {
    const {
        subWithGeostore, subWithRegion, subWithCountry, subWithUse, subWithWdpas
    } = subscriptions;
    const geostoreDatasetID = subWithGeostore.datasets[0];
    const regionDatasetID = subWithRegion.datasets[0];
    const countryDatasetID = subWithCountry.datasets[0];
    const useDatasetID = subWithUse.datasets[0];
    const wdpaDatasetID = subWithWdpas.datasets[0];

    return {
        [geostoreDatasetID]: {
            ...actualGroupStatistic[geostoreDatasetID],
            geostore: 1
        },
        [regionDatasetID]: {
            ...actualGroupStatistic[regionDatasetID],
            regions: {
                test: 1,
            },
            regionTop: {
                nameRegion: subWithRegion.params.iso.region,
                value: 1,
            }
        },
        [countryDatasetID]: {
            ...actualGroupStatistic[countryDatasetID],
            country: 1,
            countryTop: {
                name: subWithCountry.params.iso.country,
                value: 1
            }
        },
        [useDatasetID]: {
            ...actualGroupStatistic[useDatasetID],
            use: 1
        },
        [wdpaDatasetID]: {
            ...actualGroupStatistic[wdpaDatasetID],
            wdpa: 1,
            wdpaTop: {
                id: subWithWdpas.params.wdpaid,
                value: 1,
            }
        }
    };
};

module.exports = {
    createExpectedGroupStatistics, createStatistics, createSubscriptions, getUserAsSingleObject
};
