const nock = require('nock');
const config = require('config');
const { mockDataset, MOCK_USERS } = require('./test.constants');

const createMockDataset = (id) => nock(process.env.CT_URL)
    .get(`/v1/dataset/${id}`)
    .reply(200, {
        data: mockDataset(id)
    });

const createMockUsersWithRange = (startDate, endDate) => nock(process.env.CT_URL)
    .get(`/v1/user/obtain/all-users?start=${startDate.toISOString().substring(0, 10)}&end=${endDate.toISOString().substring(0, 10)}`)
    .reply(200, { data: MOCK_USERS });

const createMockSendConfirmationSUB = () => nock(config.get('gfw.flagshipUrl'))
    .get('/my-gfw/subscriptions')
    .reply(200, { mockMessage: 'Should redirect' });

const createMockConfirmSUB = (url = '/my-gfw/subscriptions?subscription_confirmed=true', host = config.get('gfw.flagshipUrl')) => nock(host)
    .get(url)
    .reply(200, { mockMessage: 'Should redirect' });

const createMockUnsubscribeSUB = () => nock(config.get('gfw.flagshipUrl'))
    .get('/my-gfw/subscriptions?unsubscription_confirmed=true')
    .reply(200, { mockMessage: 'Should redirect' });

const createMockUsers = (userIDS) => {
    const createMock = (user) => nock(process.env.CT_URL)
        .get(`/v1/user/${user.id}`)
        .reply(200, { data: user });

    userIDS.map((userID) => createMock(MOCK_USERS.find((user) => user.id === userID)));
};

// ---------------------- DATA API MOCKS ----------------------

// ---------------------- GLAD ALERTS ----------------------

const mockGLADAlertsISOQuery = (
    times = 1,
    overrideData = {},
    overrideStatusCode = 200,
) => {
    nock(config.get('dataApi.url'))
        .get(`/dataset/${config.get('datasets.gladISODataset')}/latest/query`)
        .query(() => true)
        .matchHeader('x-api-key', config.get('dataApi.apiKey'))
        .matchHeader('origin', config.get('dataApi.origin'))
        .times(times)
        .reply(overrideStatusCode, {
            data: [
                {
                    iso: 'BRA',
                    adm1: 1,
                    adm2: 1,
                    alert__date: '2020-05-16',
                    is__confirmed_alert: true,
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
                    alert__count: 20,
                    alert_area__ha: 6.593884924546713,
                    whrc_aboveground_co2_emissions__Mg: 3358.510681748128
                },
                {
                    iso: 'BRA',
                    adm1: 1,
                    adm2: 1,
                    alert__date: '2020-05-16',
                    is__confirmed_alert: true,
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
                    alert__count: 20,
                    alert_area__ha: 0.6820241552093904,
                    whrc_aboveground_co2_emissions__Mg: 258.688898910305
                },
                {
                    iso: 'BRA',
                    adm1: 1,
                    adm2: 2,
                    alert__date: '2020-05-22',
                    is__confirmed_alert: true,
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
                    alert__count: 20,
                    alert_area__ha: 1.2847919558279424,
                    whrc_aboveground_co2_emissions__Mg: 742.8023458925888
                },
                {
                    iso: 'BRA',
                    adm1: 1,
                    adm2: 2,
                    alert__date: '2020-05-22',
                    is__confirmed_alert: true,
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
                    alert__count: 20,
                    alert_area__ha: 11.865565996302724,
                    whrc_aboveground_co2_emissions__Mg: 8388.552492798133
                },
                {
                    iso: 'BRA',
                    adm1: 1,
                    adm2: 2,
                    alert__date: '2020-05-22',
                    is__confirmed_alert: true,
                    wdpa_protected_area__iucn_cat: 'Other Category',
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
                    bra_biome__name: 'Not applicable',
                    alert__count: 20,
                    alert_area__ha: 0.07556348891710714,
                    whrc_aboveground_co2_emissions__Mg: 38.6507245811003
                }
            ],
            status: 'success',
            ...overrideData,
        });
};

const mockGLADAlertsWDPAQuery = (
    times = 1,
    overrideData = {},
    overrideStatusCode = 200,
) => {
    nock(config.get('dataApi.url'))
        .get(`/dataset/${config.get('datasets.gladWDPADataset')}/latest/query`)
        .query(() => true)
        .matchHeader('x-api-key', config.get('dataApi.apiKey'))
        .matchHeader('origin', config.get('dataApi.origin'))
        .times(times)
        .reply(overrideStatusCode, {
            data: [
                {
                    wdpa_protected_area__id: '900852',
                    wdpa_protected_area__name: 'Kilombero Valley Floodplain',
                    wdpa_protected_area__iucn_cat: 'Not Reported',
                    wdpa_protected_area__iso: 'Designated',
                    wdpa_protected_area__status: 'TZA',
                    alert__date: '2020-05-02',
                    is__confirmed_alert: true,
                    is__umd_regional_primary_forest_2001: false,
                    is__birdlife_alliance_for_zero_extinction_site: false,
                    is__birdlife_key_biodiversity_area: false,
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
                    alert__count: 20,
                    alert_area__ha: 0.3806870092013672,
                    whrc_aboveground_co2_emissions__Mg: 126.32476287899374
                },
                {
                    wdpa_protected_area__id: '900852',
                    wdpa_protected_area__name: 'Kilombero Valley Floodplain',
                    wdpa_protected_area__iucn_cat: 'Not Reported',
                    wdpa_protected_area__iso: 'Designated',
                    wdpa_protected_area__status: 'TZA',
                    alert__date: '2020-05-03',
                    is__confirmed_alert: true,
                    is__umd_regional_primary_forest_2001: false,
                    is__birdlife_alliance_for_zero_extinction_site: false,
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
                    alert__count: 20,
                    alert_area__ha: 0.07606778742132815,
                    whrc_aboveground_co2_emissions__Mg: 14.364133858060798
                },
                {
                    wdpa_protected_area__id: '900852',
                    wdpa_protected_area__name: 'Kilombero Valley Floodplain',
                    wdpa_protected_area__iucn_cat: 'Not Reported',
                    wdpa_protected_area__iso: 'Designated',
                    wdpa_protected_area__status: 'TZA',
                    alert__date: '2020-05-10',
                    is__confirmed_alert: true,
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
                    alert__count: 20,
                    alert_area__ha: 0.9119679457925914,
                    whrc_aboveground_co2_emissions__Mg: 249.5500909359493
                },
                {
                    wdpa_protected_area__id: '900852',
                    wdpa_protected_area__name: 'Kilombero Valley Floodplain',
                    wdpa_protected_area__iucn_cat: 'Not Reported',
                    wdpa_protected_area__iso: 'Designated',
                    wdpa_protected_area__status: 'TZA',
                    alert__date: '2020-05-10',
                    is__confirmed_alert: true,
                    is__umd_regional_primary_forest_2001: false,
                    is__birdlife_alliance_for_zero_extinction_site: false,
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
                    alert__count: 20,
                    alert_area__ha: 1.3693515543228605,
                    whrc_aboveground_co2_emissions__Mg: 262.6178803989895
                },
                {
                    wdpa_protected_area__id: '900852',
                    wdpa_protected_area__name: 'Kilombero Valley Floodplain',
                    wdpa_protected_area__iucn_cat: 'Not Reported',
                    wdpa_protected_area__iso: 'Designated',
                    wdpa_protected_area__status: 'TZA',
                    alert__date: '2020-05-10',
                    is__confirmed_alert: true,
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
                    alert__count: 20,
                    alert_area__ha: 0.7601606223708767,
                    whrc_aboveground_co2_emissions__Mg: 172.83017320295085
                }
            ],
            status: 'success',
            ...overrideData,
        });
};

const mockGLADAlertsGeostoreQuery = (
    times = 1,
    overrideData = {},
    overrideStatusCode = 200,
) => {
    nock(config.get('dataApi.url'))
        .get(`/dataset/${config.get('datasets.gladGeostoreDataset')}/latest/query`)
        .query(() => true)
        .matchHeader('x-api-key', config.get('dataApi.apiKey'))
        .matchHeader('origin', config.get('dataApi.origin'))
        .times(times)
        .reply(overrideStatusCode, {
            data: [
                {
                    geostore__id: '02ca2fbafa2d818aa3d1b974a581fbd0',
                    alert__date: '2020-05-16',
                    is__confirmed_alert: true,
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
                    alert__count: 25,
                    alert_area__ha: 0.38053146633949664,
                    whrc_aboveground_co2_emissions__Mg: 58.18439951061627
                },
                {
                    geostore__id: '02ca2fbafa2d818aa3d1b974a581fbd0',
                    alert__date: '2020-05-16',
                    is__confirmed_alert: true,
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
                    alert__count: 25,
                    alert_area__ha: 3.500055813757397,
                    whrc_aboveground_co2_emissions__Mg: 536.918608597304
                },
                {
                    geostore__id: '02ca2fbafa2d818aa3d1b974a581fbd0',
                    alert__date: '2020-05-23',
                    is__confirmed_alert: true,
                    wdpa_protected_area__iucn_cat: 'Category Ia/b or II',
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
                    alert__count: 25,
                    alert_area__ha: 0.22829904843206167,
                    whrc_aboveground_co2_emissions__Mg: 45.6227832580998
                },
                {
                    geostore__id: '02ca2fbafa2d818aa3d1b974a581fbd0',
                    alert__date: '2020-05-23',
                    is__confirmed_alert: true,
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
                    alert__count: 25,
                    alert_area__ha: 1.748481659494258,
                    whrc_aboveground_co2_emissions__Mg: 403.34223675085696
                }
            ],
            status: 'success',
            ...overrideData,
        });
};

// ---------------------- VIIRS ALERTS ----------------------

const mockVIIRSAlertsISOQuery = (
    times = 1,
    overrideData = {},
    overrideStatusCode = 200,
) => {
    nock(config.get('dataApi.url'))
        .get(`/dataset/${config.get('datasets.viirsISODataset')}/latest/query`)
        .query(() => true)
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

const mockVIIRSAlertsWDPAQuery = (
    times = 1,
    overrideData = {},
    overrideStatusCode = 200,
) => {
    nock(config.get('dataApi.url'))
        .get(`/dataset/${config.get('datasets.viirsWDPADataset')}/latest/query`)
        .query(() => true)
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

const mockVIIRSAlertsGeostoreQuery = (
    times = 1,
    overrideData = {},
    overrideStatusCode = 200,
) => {
    nock(config.get('dataApi.url'))
        .get(`/dataset/${config.get('datasets.viirsGeostoreDataset')}/latest/query`)
        .query(() => true)
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
    createMockUsersWithRange,
    createMockUsers,
    mockGLADAlertsISOQuery,
    mockGLADAlertsWDPAQuery,
    mockGLADAlertsGeostoreQuery,
    mockVIIRSAlertsISOQuery,
    mockVIIRSAlertsWDPAQuery,
    mockVIIRSAlertsGeostoreQuery,
    createMockGeostore,
};
