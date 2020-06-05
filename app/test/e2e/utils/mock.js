const nock = require('nock');
const config = require('config');
const {
    mockDataset, MOCK_FILE, MOCK_USERS
} = require('./test.constants');

const createMockDataset = (id) => nock(process.env.CT_URL)
    .get(`/v1/dataset/${id}`)
    .reply(200, {
        data: mockDataset(id)
    });

const createMockQuery = () => nock(process.env.CT_URL)
    .get(/\/v1\/query\?(.)*/)
    .reply(200, {
        data: { url: MOCK_FILE }
    });

const createMockUsersWithRange = (startDate, endDate) => nock(process.env.CT_URL)
    .get(`/v1/user/obtain/all-users?start=${startDate.toISOString().substring(0, 10)}&end=${endDate.toISOString().substring(0, 10)}`)
    .reply(200, { data: MOCK_USERS });

const createMockSendConfirmationSUB = () => nock(config.get('gfw.flagshipUrl'))
    .get('/my_gfw/subscriptions')
    .reply(200, { mockMessage: 'Should redirect' });

const createMockConfirmSUB = (url = '/my_gfw/subscriptions?subscription_confirmed=true', host = config.get('gfw.flagshipUrl')) => nock(host)
    .get(url)
    .reply(200, { mockMessage: 'Should redirect' });

const createMockUnsubscribeSUB = () => nock(config.get('gfw.flagshipUrl'))
    .get('/my_gfw/subscriptions?unsubscription_confirmed=true')
    .reply(200, { mockMessage: 'Should redirect' });

const createMockUsers = (userIDS) => {
    const createMock = (user) => nock(process.env.CT_URL)
        .get(`/v1/user/${user.id}`)
        .reply(200, { data: user });

    userIDS.map((userID) => createMock(MOCK_USERS.find((user) => user.id === userID)));
};

const createMockLatestDataset = (datasetID, date) => nock(process.env.CT_URL)
    .get(`/v1/${datasetID}/latest`)
    .reply(200, { data: { date } });

const createMockAlertsQuery = (times = 1, datasetId = undefined, overrideData = {}) => {
    const id = datasetId || config.get('datasets.gladGeostoreDataset');
    nock(process.env.CT_URL)
        .get(`/v1/query/${id}`)
        .query(() => true)
        .times(times)
        .reply(200, {
            data: [
                {
                    geostore__id: 'test',
                    alert__date: '2019-10-10',
                    is__confirmed_alert: false,
                    is__regional_primary_forest: false,
                    is__alliance_for_zero_extinction_site: false,
                    is__key_biodiversity_area: false,
                    is__landmark: false,
                    gfw_plantation__type: 0,
                    is__gfw_mining: true,
                    is__gfw_logging: false,
                    rspo_oil_palm__certification_status: 0,
                    is__gfw_wood_fiber: false,
                    is__peat_land: false,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: 0,
                    per_forest_concession__type: 0,
                    is__gfw_oil_gas: false,
                    is__mangroves_2016: true,
                    intact_forest_landscapes_2016: true,
                    bra_biome__name: 'Amazônia',
                    alert__count: 6,
                    alert_area__ha: 0.45252535669866123,
                    aboveground_co2_emissions__Mg: 117.25617750097409,
                    _id: 'AW6O0fqMLu2ttL7ZDM5u'
                },
                {
                    geostore__id: 'test',
                    alert__date: '2019-10-11',
                    is__confirmed_alert: false,
                    is__regional_primary_forest: true,
                    is__alliance_for_zero_extinction_site: false,
                    is__key_biodiversity_area: false,
                    is__landmark: false,
                    gfw_plantation__type: 0,
                    is__gfw_mining: false,
                    is__gfw_logging: false,
                    rspo_oil_palm__certification_status: 0,
                    is__gfw_wood_fiber: false,
                    is__peat_land: false,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: 0,
                    per_forest_concession__type: 0,
                    is__gfw_oil_gas: false,
                    is__mangroves_2016: true,
                    intact_forest_landscapes_2016: false,
                    bra_biome__name: 'Cerrado',
                    alert__count: 7,
                    alert_area__ha: 1.278691435436168,
                    aboveground_co2_emissions__Mg: 332.72845357758285,
                    _id: 'AW6O0fqMLu2ttL7ZDM8E'
                },
                {
                    geostore__id: 'test',
                    alert__date: '2019-10-12',
                    is__confirmed_alert: false,
                    is__regional_primary_forest: false,
                    is__alliance_for_zero_extinction_site: false,
                    is__key_biodiversity_area: false,
                    is__landmark: false,
                    gfw_plantation__type: 0,
                    is__gfw_mining: false,
                    is__gfw_logging: false,
                    rspo_oil_palm__certification_status: 0,
                    is__gfw_wood_fiber: false,
                    is__peat_land: true,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: 0,
                    per_forest_concession__type: 0,
                    is__gfw_oil_gas: false,
                    is__mangroves_2016: true,
                    intact_forest_landscapes_2016: false,
                    bra_biome__name: 'Cerrado',
                    alert__count: 8,
                    alert_area__ha: 1.278691435436168,
                    aboveground_co2_emissions__Mg: 332.72845357758285,
                    _id: 'AW6O0fqMLu2ttL7ZDM8E'
                },
                {
                    geostore__id: 'test',
                    alert__date: '2019-10-13',
                    is__confirmed_alert: false,
                    is__regional_primary_forest: false,
                    is__alliance_for_zero_extinction_site: false,
                    is__key_biodiversity_area: false,
                    is__landmark: false,
                    gfw_plantation__type: 0,
                    is__gfw_mining: false,
                    is__gfw_logging: false,
                    rspo_oil_palm__certification_status: 0,
                    is__gfw_wood_fiber: false,
                    is__peat_land: false,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: 0,
                    per_forest_concession__type: 0,
                    is__gfw_oil_gas: false,
                    is__mangroves_2016: true,
                    intact_forest_landscapes_2016: false,
                    bra_biome__name: 'Cerrado',
                    wdpa_id: 'example',
                    alert__count: 9,
                    alert_area__ha: 1.278691435436168,
                    aboveground_co2_emissions__Mg: 332.72845357758285,
                    _id: 'AW6O0fqMLu2ttL7ZDM8E'
                },
                {
                    geostore__id: 'test',
                    alert__date: '2019-10-14',
                    is__confirmed_alert: false,
                    is__regional_primary_forest: false,
                    is__alliance_for_zero_extinction_site: false,
                    is__key_biodiversity_area: false,
                    is__landmark: false,
                    gfw_plantation__type: 1,
                    is__gfw_mining: false,
                    is__gfw_logging: false,
                    rspo_oil_palm__certification_status: 0,
                    is__gfw_wood_fiber: false,
                    is__peat_land: false,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: 0,
                    per_forest_concession__type: 0,
                    is__gfw_oil_gas: false,
                    is__mangroves_2016: true,
                    intact_forest_landscapes_2016: false,
                    bra_biome__name: 'Cerrado',
                    alert__count: 10,
                    alert_area__ha: 1.278691435436168,
                    aboveground_co2_emissions__Mg: 332.72845357758285,
                    _id: 'AW6O0fqMLu2ttL7ZDM8E'
                },
                {
                    geostore__id: 'test',
                    alert__date: '2019-10-15',
                    is__confirmed_alert: false,
                    is__regional_primary_forest: false,
                    is__alliance_for_zero_extinction_site: false,
                    is__key_biodiversity_area: false,
                    is__landmark: false,
                    gfw_plantation__type: 0,
                    is__gfw_mining: false,
                    is__gfw_logging: false,
                    rspo_oil_palm__certification_status: 0,
                    is__gfw_wood_fiber: false,
                    is__peat_land: false,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: 0,
                    per_forest_concession__type: 0,
                    is__gfw_oil_gas: false,
                    is__mangroves_2016: true,
                    intact_forest_landscapes_2016: false,
                    bra_biome__name: 'Cerrado',
                    alert__count: 11,
                    alert_area__ha: 1.278691435436168,
                    aboveground_co2_emissions__Mg: 332.72845357758285,
                    _id: 'AW6O0fqMLu2ttL7ZDM8E'
                }
            ],
            meta: {
                cloneUrl: {
                    http_method: 'POST',
                    url: `/v1/dataset/${id}/clone`,
                    body: {
                        dataset: {
                            // eslint-disable-next-line max-len
                            datasetUrl: `/v1/query/${id}?sql=SELECT%20%2A%20FROM%20data%20WHERE%20alert__date%20%3E%20%272019-10-01%27%20AND%20alert__date%20%3C%20%272020-01-01%27%20AND%20geostore__id%20%3D%20%27test%27`,
                            application: [
                                'your',
                                'apps'
                            ]
                        }
                    }
                }
            },
            ...overrideData,
        });
};

const createMockGeostore = (path, times = 1) => {
    nock(process.env.CT_URL)
        .get(path)
        .times(times)
        .reply(200, {
            data: {
                type: 'geoStore',
                id: 'f98f505878dcee72a2e92e7510a07d6f',
                attributes: {
                    geojson: {
                        features: [{
                            properties: null,
                            type: 'Feature',
                            geometry: {
                                type: 'MultiPolygon',
                                coordinates: [[[[117.36772481838, -0.64399409467464]]]]
                            }
                        }],
                        crs: {},
                        type: 'FeatureCollection'
                    },
                    hash: 'f98f505878dcee72a2e92e7510a07d6f',
                    provider: {},
                    areaHa: 190132126.08844432,
                    bbox: [95.01091766, -11.00761509, 141.01939392, 5.90682268],
                    lock: false,
                    info: {
                        use: {},
                        iso: 'IDN',
                        name: 'Indonesia',
                        gadm: '3.6',
                        simplifyThresh: 0.1
                    }
                }
            }
        });
};

module.exports = {
    createMockUnsubscribeSUB,
    createMockSendConfirmationSUB,
    createMockDataset,
    createMockConfirmSUB,
    createMockQuery,
    createMockUsersWithRange,
    createMockUsers,
    createMockLatestDataset,
    createMockAlertsQuery,
    createMockGeostore,
};
