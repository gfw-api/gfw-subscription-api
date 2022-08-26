import nock from 'nock';
import config from 'config';
import { MOCK_USERS, mockDataset } from './test.constants';

export const createMockDataset = (id: string, data: Record<string, any>) => nock(process.env.GATEWAY_URL)
    .get(`/v1/dataset/${id}`)
    .reply(200, {
        data: mockDataset(id, data)
    });

export const createMockDatasetQuery = (query: Record<string, any>, response: any) => nock(process.env.GATEWAY_URL)
    .get(`/v1/query`)
    .query(query)
    .reply(200, response);

export const createMockGetDatasetMetadata = (datasetId: string, application: string, language: string, response: any) => nock(process.env.GATEWAY_URL)
    .get(`/v1/dataset/${datasetId}/metadata?application=${application}&language=${language}`)
    .reply(200, response);

export const createMockUsersWithRange = (startDate: Date, endDate: Date) => nock(process.env.GATEWAY_URL)
    .get(`/v1/user/obtain/all-users?start=${startDate.toISOString().substring(0, 10)}&end=${endDate.toISOString().substring(0, 10)}`)
    .reply(200, { data: MOCK_USERS });

export const createMockSendConfirmationSUB = () => nock(config.get('gfw.flagshipUrl'))
    .get('/my-gfw/subscriptions')
    .reply(200, { mockMessage: 'Should redirect' });

export const createMockConfirmSUB = (url = '/my-gfw/subscriptions?subscription_confirmed=true', host: string = config.get('gfw.flagshipUrl')) => nock(host)
    .get(url)
    .reply(200, { mockMessage: 'Should redirect' });

export const createMockUnsubscribeSUB = () => nock(config.get('gfw.flagshipUrl'))
    .get('/my-gfw/subscriptions?unsubscription_confirmed=true')
    .reply(200, { mockMessage: 'Should redirect' });

export const createMockUsers = (userIDS: string[]) => {
    const createMock = (user: Record<string, any>) => nock(process.env.GATEWAY_URL)
        .get(`/v1/user/${user.id}`)
        .reply(200, { data: user });

    userIDS.map((userID: string) => createMock(MOCK_USERS.find((user) => user.id === userID)));
};

// ---------------------- DATA API MOCKS ----------------------


// ---------------------- VIIRS ALERTS ----------------------

export const mockVIIRSAlertsISOQuery = (
    times = 1,
    overrideData = {},
    overrideStatusCode = 200,
) => {
    nock(config.get('dataApi.url'))
        .get(`/dataset/${config.get('datasets.viirsISODataset')}/latest/query`)
        .query((data) => data.sql && data.sql.includes('iso = \'BRA\''))
        .matchHeader('x-api-key', config.get('dataApi.apiKey'))
        .matchHeader('origin', config.get('dataApi.origin'))
        .times(times)
        .reply(overrideStatusCode, {
            data: [
                {
                    iso: 'BRA',
                    adm1: 1,
                    adm2: 1,
                    alert__date: '2012-08-04',
                    confidence__cat: 'h',
                    wdpa_protected_area__iucn_cat: null,
                    is__umd_regional_primary_forest_2001: true,
                    is__birdlife_alliance_for_zero_extinction_site: false,
                    is__birdlife_key_biodiversity_area: false,
                    is__landmark_land_right: false,
                    gfw_plantation__type: null,
                    is__gfw_mining: false,
                    is__gfw_managed_forest: false,
                    rspo_oil_palm__certification_status: null,
                    is__gfw_wood_fiber: false,
                    is__peatland: false,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: null,
                    per_forest_concession__type: null,
                    is__gfw_oil_gas: false,
                    is__gmw_mangroves_2016: false,
                    is__ifl_intact_forest_landscape_2016: false,
                    bra_biome__name: 'Amazônia',
                    alert__count: 25
                },
                {
                    iso: 'BRA',
                    adm1: 1,
                    adm2: 1,
                    alert__date: '2012-08-05',
                    confidence__cat: 'h',
                    wdpa_protected_area__iucn_cat: null,
                    is__umd_regional_primary_forest_2001: true,
                    is__birdlife_alliance_for_zero_extinction_site: false,
                    is__birdlife_key_biodiversity_area: false,
                    is__landmark_land_right: false,
                    gfw_plantation__type: null,
                    is__gfw_mining: false,
                    is__gfw_managed_forest: false,
                    rspo_oil_palm__certification_status: null,
                    is__gfw_wood_fiber: false,
                    is__peatland: false,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: null,
                    per_forest_concession__type: null,
                    is__gfw_oil_gas: false,
                    is__gmw_mangroves_2016: false,
                    is__ifl_intact_forest_landscape_2016: false,
                    bra_biome__name: 'Amazônia',
                    alert__count: 25
                },
                {
                    iso: 'BRA',
                    adm1: 1,
                    adm2: 1,
                    alert__date: '2012-08-05',
                    confidence__cat: 'h',
                    wdpa_protected_area__iucn_cat: null,
                    is__umd_regional_primary_forest_2001: false,
                    is__birdlife_alliance_for_zero_extinction_site: false,
                    is__birdlife_key_biodiversity_area: false,
                    is__landmark_land_right: false,
                    gfw_plantation__type: null,
                    is__gfw_mining: false,
                    is__gfw_managed_forest: false,
                    rspo_oil_palm__certification_status: null,
                    is__gfw_wood_fiber: false,
                    is__peatland: false,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: null,
                    per_forest_concession__type: null,
                    is__gfw_oil_gas: false,
                    is__gmw_mangroves_2016: false,
                    is__ifl_intact_forest_landscape_2016: false,
                    bra_biome__name: 'Amazônia',
                    alert__count: 25
                },
                {
                    iso: 'BRA',
                    adm1: 1,
                    adm2: 1,
                    alert__date: '2012-08-26',
                    confidence__cat: 'h',
                    wdpa_protected_area__iucn_cat: null,
                    is__umd_regional_primary_forest_2001: true,
                    is__birdlife_alliance_for_zero_extinction_site: false,
                    is__birdlife_key_biodiversity_area: false,
                    is__landmark_land_right: false,
                    gfw_plantation__type: null,
                    is__gfw_mining: false,
                    is__gfw_managed_forest: false,
                    rspo_oil_palm__certification_status: null,
                    is__gfw_wood_fiber: false,
                    is__peatland: false,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: null,
                    per_forest_concession__type: null,
                    is__gfw_oil_gas: false,
                    is__gmw_mangroves_2016: false,
                    is__ifl_intact_forest_landscape_2016: false,
                    bra_biome__name: 'Amazônia',
                    alert__count: 25
                }
            ],
            status: 'success',
            ...overrideData,
        });
};

export const mockVIIRSAlertsWDPAQuery = (
    times = 1,
    overrideData = {},
    overrideStatusCode = 200,
) => {
    nock(config.get('dataApi.url'))
        .get(`/dataset/${config.get('datasets.viirsWDPADataset')}/latest/query`)
        .query((data) => data.sql && data.sql.includes('wdpa_protected_area__id = \'1\''))
        .matchHeader('x-api-key', config.get('dataApi.apiKey'))
        .matchHeader('origin', config.get('dataApi.origin'))
        .times(times)
        .reply(overrideStatusCode, {
            data: [
                {
                    wdpa_protected_area__id: '166969',
                    wdpa_protected_area__name: 'La Sepultura',
                    wdpa_protected_area__iucn_cat: 'VI',
                    wdpa_protected_area__iso: 'MEX',
                    wdpa_protected_area__status: 'Designated',
                    alert__date: '2020-05-09',
                    confidence__cat: 'h',
                    is__umd_regional_primary_forest_2001: false,
                    is__birdlife_alliance_for_zero_extinction_site: true,
                    is__birdlife_key_biodiversity_area: true,
                    is__landmark_land_right: false,
                    gfw_plantation__type: null,
                    is__gfw_mining: false,
                    is__gfw_managed_forest: false,
                    rspo_oil_palm__certification_status: null,
                    is__gfw_wood_fiber: false,
                    is__peatland: false,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: null,
                    per_forest_concession__type: null,
                    is__gfw_oil_gas: false,
                    is__gmw_mangroves_2016: false,
                    is__ifl_intact_forest_landscape_2016: false,
                    bra_biome__name: 'Not applicable',
                    alert__count: 25
                },
                {
                    wdpa_protected_area__id: '166969',
                    wdpa_protected_area__name: 'La Sepultura',
                    wdpa_protected_area__iucn_cat: 'VI',
                    wdpa_protected_area__iso: 'MEX',
                    wdpa_protected_area__status: 'Designated',
                    alert__date: '2020-05-09',
                    confidence__cat: 'h',
                    is__umd_regional_primary_forest_2001: true,
                    is__birdlife_alliance_for_zero_extinction_site: true,
                    is__birdlife_key_biodiversity_area: true,
                    is__landmark_land_right: true,
                    gfw_plantation__type: null,
                    is__gfw_mining: false,
                    is__gfw_managed_forest: false,
                    rspo_oil_palm__certification_status: null,
                    is__gfw_wood_fiber: false,
                    is__peatland: false,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: null,
                    per_forest_concession__type: null,
                    is__gfw_oil_gas: false,
                    is__gmw_mangroves_2016: false,
                    is__ifl_intact_forest_landscape_2016: false,
                    bra_biome__name: 'Not applicable',
                    alert__count: 25
                },
                {
                    wdpa_protected_area__id: '166969',
                    wdpa_protected_area__name: 'La Sepultura',
                    wdpa_protected_area__iucn_cat: 'VI',
                    wdpa_protected_area__iso: 'MEX',
                    wdpa_protected_area__status: 'Designated',
                    alert__date: '2020-05-10',
                    confidence__cat: 'h',
                    is__umd_regional_primary_forest_2001: false,
                    is__birdlife_alliance_for_zero_extinction_site: true,
                    is__birdlife_key_biodiversity_area: true,
                    is__landmark_land_right: false,
                    gfw_plantation__type: null,
                    is__gfw_mining: false,
                    is__gfw_managed_forest: false,
                    rspo_oil_palm__certification_status: null,
                    is__gfw_wood_fiber: false,
                    is__peatland: false,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: null,
                    per_forest_concession__type: null,
                    is__gfw_oil_gas: false,
                    is__gmw_mangroves_2016: false,
                    is__ifl_intact_forest_landscape_2016: false,
                    bra_biome__name: 'Not applicable',
                    alert__count: 25
                },
                {
                    wdpa_protected_area__id: '166969',
                    wdpa_protected_area__name: 'La Sepultura',
                    wdpa_protected_area__iucn_cat: 'VI',
                    wdpa_protected_area__iso: 'MEX',
                    wdpa_protected_area__status: 'Designated',
                    alert__date: '2020-05-06',
                    confidence__cat: 'l',
                    is__umd_regional_primary_forest_2001: false,
                    is__birdlife_alliance_for_zero_extinction_site: true,
                    is__birdlife_key_biodiversity_area: true,
                    is__landmark_land_right: true,
                    gfw_plantation__type: null,
                    is__gfw_mining: false,
                    is__gfw_managed_forest: false,
                    rspo_oil_palm__certification_status: null,
                    is__gfw_wood_fiber: false,
                    is__peatland: false,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: null,
                    per_forest_concession__type: null,
                    is__gfw_oil_gas: false,
                    is__gmw_mangroves_2016: false,
                    is__ifl_intact_forest_landscape_2016: false,
                    bra_biome__name: 'Not applicable',
                    alert__count: 25
                }
            ],
            status: 'success',
            ...overrideData,
        });
};

export const mockVIIRSAlertsGeostoreQuery = (
    times = 1,
    overrideData = {},
    overrideStatusCode = 200,
) => {
    nock(config.get('dataApi.url'))
        .get(`/dataset/${config.get('datasets.viirsGeostoreDataset')}/latest/query`)
        .query((data) => data.sql && data.sql.includes('geostore__id = \'423e5dfb0448e692f97b590c61f45f22\''))
        .matchHeader('x-api-key', config.get('dataApi.apiKey'))
        .matchHeader('origin', config.get('dataApi.origin'))
        .times(times)
        .reply(overrideStatusCode, {
            data: [
                {
                    geostore__id: '02ca2fbafa2d818aa3d1b974a581fbd0',
                    alert__date: '2020-05-08',
                    confidence__cat: 'n',
                    wdpa_protected_area__iucn_cat: null,
                    is__umd_regional_primary_forest_2001: false,
                    is__birdlife_alliance_for_zero_extinction_site: false,
                    is__birdlife_key_biodiversity_area: false,
                    is__landmark_land_right: false,
                    gfw_plantation__type: null,
                    is__gfw_mining: false,
                    is__gfw_managed_forest: false,
                    rspo_oil_palm__certification_status: null,
                    is__gfw_wood_fiber: false,
                    is__peatland: false,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: null,
                    per_forest_concession__type: null,
                    is__gfw_oil_gas: false,
                    is__gmw_mangroves_2016: false,
                    is__ifl_intact_forest_landscape_2016: false,
                    bra_biome__name: 'Not applicable',
                    alert__count: 50
                },
                {
                    geostore__id: '02ca2fbafa2d818aa3d1b974a581fbd0',
                    alert__date: '2020-05-08',
                    confidence__cat: 'n',
                    wdpa_protected_area__iucn_cat: 'Other Category',
                    is__umd_regional_primary_forest_2001: false,
                    is__birdlife_alliance_for_zero_extinction_site: false,
                    is__birdlife_key_biodiversity_area: true,
                    is__landmark_land_right: false,
                    gfw_plantation__type: null,
                    is__gfw_mining: false,
                    is__gfw_managed_forest: false,
                    rspo_oil_palm__certification_status: null,
                    is__gfw_wood_fiber: false,
                    is__peatland: false,
                    is__idn_forest_moratorium: false,
                    is__gfw_oil_palm: false,
                    idn_forest_area__type: null,
                    per_forest_concession__type: null,
                    is__gfw_oil_gas: false,
                    is__gmw_mangroves_2016: false,
                    is__ifl_intact_forest_landscape_2016: false,
                    bra_biome__name: 'Not applicable',
                    alert__count: 50
                }
            ],
            status: 'success',
            ...overrideData,
        });
};

export const createMockGeostore = (path: string, times = 1) => {
    nock(process.env.GATEWAY_URL)
        .get(path)
        .times(times)
        .reply(200, {
            data: {
                type: 'geoStore',
                id: '423e5dfb0448e692f97b590c61f45f22',
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
                    hash: '423e5dfb0448e692f97b590c61f45f22',
                    provider: {},
                    areaHa: 190132126.08844432,
                    bbox: [95.01091766, -11.00761509, 141.01939392, 5.90682268],
                    lock: false,
                    info: {
                        use: {},
                        iso: 'BRA',
                        name: 'Indonesia',
                        gadm: '3.6',
                        simplifyThresh: 0.1
                    }
                }
            }
        });
};
