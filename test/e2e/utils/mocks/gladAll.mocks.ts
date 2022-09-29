import nock from 'nock';
import config from 'config';
import { Moment } from 'moment';
import qs from 'qs';

export const createGLADAllGeostoreURLSubscriptionBody = (subscription: Record<string, any>, beginDate: Moment, endDate: Moment, bodyData: Record<string, any> = {}) => {
    const mapURLIntactForestQueryString = {
        lang: subscription.language,
        map: btoa(JSON.stringify({
            canBound: true,
            datasets: [
                {
                    dataset: 'bfd1d211-8106-4393-86c3-9e1ab2ee1b9b',
                    layers: [
                        '8e4a527d-1bcd-4a12-82b0-5a108ffec452'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    }
                },
                {
                    dataset: 'intact-forest-landscapes',
                    opacity: 1,
                    visibility: true,
                    layers: [
                        'intact-forest-landscapes'
                    ]
                }
            ],
            basemap: {
                value: 'planet',
                color: '',
                name: 'latest',
                imageType: 'analytic'
            }
        })),
        mainMap: btoa(JSON.stringify({
            showAnalysis: true
        }))
    };
    const mapURLPrimaryForestQueryString = {
        lang: subscription.language,
        map: btoa(JSON.stringify({
            canBound: true,
            datasets: [
                {
                    dataset: 'bfd1d211-8106-4393-86c3-9e1ab2ee1b9b',
                    layers: [
                        '8e4a527d-1bcd-4a12-82b0-5a108ffec452'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    }
                },
                {
                    dataset: 'primary-forests',
                    opacity: 1,
                    visibility: true,
                    layers: [
                        'primary-forests-2001'
                    ]
                }
            ],
            basemap: {
                value: 'planet',
                color: '',
                name: 'latest',
                imageType: 'analytic'
            }
        })),
        mainMap: btoa(JSON.stringify({
            showAnalysis: true
        }))
    };
    const mapURLPeatQueryString = {
        lang: subscription.language,
        map: btoa(JSON.stringify({
            canBound: true,
            datasets: [
                {
                    dataset: 'bfd1d211-8106-4393-86c3-9e1ab2ee1b9b',
                    layers: [
                        '8e4a527d-1bcd-4a12-82b0-5a108ffec452'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    }
                },
                {
                    dataset: 'malaysia-peat-lands',
                    opacity: 1,
                    visibility: true,
                    layers: [
                        'malaysia-peat-lands-2004'
                    ],
                    iso: 'MYS'
                },
                {
                    dataset: 'indonesia-forest-moratorium',
                    opacity: 1,
                    visibility: true,
                    layers: [
                        'indonesia-forest-moratorium'
                    ],
                    iso: 'IDN'
                },
                {
                    dataset: 'indonesia-peat-lands',
                    opacity: 1,
                    visibility: true,
                    layers: [
                        'indonesia-peat-lands-2012'
                    ],
                    iso: 'IDN'
                }
            ],
            basemap: {
                value: 'planet',
                color: '',
                name: 'latest',
                imageType: 'analytic'
            }
        })),
        mainMap: btoa(JSON.stringify({
            showAnalysis: true
        }))
    };
    const mapURLWDPAQueryString = {
        lang: subscription.language,
        map: btoa(JSON.stringify({
            canBound: true,
            datasets: [
                {
                    dataset: 'bfd1d211-8106-4393-86c3-9e1ab2ee1b9b',
                    layers: [
                        '8e4a527d-1bcd-4a12-82b0-5a108ffec452'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    }
                },
                {
                    dataset: 'wdpa-protected-areas',
                    opacity: 1,
                    visibility: true,
                    layers: [
                        'wdpa-protected-areas'
                    ]
                }
            ],
            basemap: {
                value: 'planet',
                color: '',
                name: 'latest',
                imageType: 'analytic'
            }
        })),
        mainMap: btoa(JSON.stringify({
            showAnalysis: true
        }))
    };

    const alertLinkQueryString = {
        lang: subscription.language,
        map: btoa(JSON.stringify({
            canBound: true,
            datasets: [
                {
                    dataset: 'bfd1d211-8106-4393-86c3-9e1ab2ee1b9b',
                    layers: [
                        '8e4a527d-1bcd-4a12-82b0-5a108ffec452'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    }
                },
                {
                    dataset: '0b0208b6-b424-4b57-984f-caddfa25ba22',
                    layers: [
                        'b45350e3-5a76-44cd-b0a9-5038a0d8bfae',
                        'cc35432d-38d7-4a03-872e-3a71a2f555fc'
                    ]
                }
            ],
            basemap: {
                value: 'planet',
                color: '',
                name: 'latest',
                imageType: 'analytic'
            }
        })),
        mainMap: btoa(JSON.stringify({
            showAnalysis: true
        }))
    };

    return {
        value: 400,
        month: beginDate.format('MMMM'),
        year: beginDate.format('YYYY'),
        week_of: beginDate.format('DD MMM'),
        week_start: beginDate.format('DD/MM/YYYY'),
        week_end: endDate.format('DD/MM/YYYY'),
        glad_count: 400,
        alert_count: 400,
        priority_areas: {
            intact_forest: 100,
            primary_forest: 100,
            peat: 100,
            protected_areas: 100,
            plantations: 0,
            other: 0
        },
        formatted_alert_count: '400',
        formatted_priority_areas: {
            intact_forest: '100',
            primary_forest: '100',
            peat: '100',
            protected_areas: '100',
            plantations: '0',
            other: '0'
        },
        alert_link: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(alertLinkQueryString)}`,
        dashboard_link: `${config.get('gfw.flagshipUrl')}/dashboards/aoi/${subscription.id}?lang=${subscription.language}&category=forest-change&utm_source=hyperlink&utm_medium=email&utm_campaign=ForestChangeAlert`,
        map_url_intact_forest: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLIntactForestQueryString)}`,
        map_url_primary_forest: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLPrimaryForestQueryString)}`,
        map_url_peat: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLPeatQueryString)}`,
        map_url_wdpa: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLWDPAQueryString)}`,
        area_ha_sum: "40",
        intact_forest_ha_sum: "10",
        primary_forest_ha_sum: "10",
        peat_ha_sum: "10",
        wdpa_ha_sum: "10",
        downloadUrls: {
            csv: `${config.get('dataApi.url')}/dataset/gfw_integrated_alerts/latest/download/csv?sql=SELECT latitude, longitude, gfw_integrated_alerts__date, umd_glad_landsat_alerts__confidence, umd_glad_sentinel2_alerts__confidence, wur_radd_alerts__confidence, gfw_integrated_alerts__confidence FROM data WHERE gfw_integrated_alerts__date >= '${beginDate.format('YYYY-MM-DD')}' AND gfw_integrated_alerts__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_origin=rw&geostore_id=423e5dfb0448e692f97b590c61f45f22`,
            json: `${config.get('dataApi.url')}/dataset/gfw_integrated_alerts/latest/download/json?sql=SELECT latitude, longitude, gfw_integrated_alerts__date, umd_glad_landsat_alerts__confidence, umd_glad_sentinel2_alerts__confidence, wur_radd_alerts__confidence, gfw_integrated_alerts__confidence FROM data WHERE gfw_integrated_alerts__date >= '${beginDate.format('YYYY-MM-DD')}' AND gfw_integrated_alerts__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_origin=rw&geostore_id=423e5dfb0448e692f97b590c61f45f22`
        },
        glad_alert_type: "total alerts",
        layerSlug: "glad-all",
        alert_name: subscription.name,
        selected_area: 'Custom Area',
        unsubscribe_url: `${config.get('apiGateway.externalUrl')}/v1/subscriptions/${subscription.id}/unsubscribe?redirect=true&lang=${subscription.language}`,
        subscriptions_url: `${config.get('gfw.flagshipUrl')}/my-gfw?lang=${subscription.language}`,
        help_center_url_manage_areas: `${config.get('gfw.flagshipUrl')}/help/map/guides/manage-saved-areas?lang=${subscription.language}`,
        help_center_url_save_more_areas: `${config.get('gfw.flagshipUrl')}/help/map/guides/save-area-subscribe-forest-change-notifications?lang=${subscription.language}`,
        help_center_url_investigate_alerts: `${config.get('gfw.flagshipUrl')}/help/map/guides/investigate-forest-change-satellite-imagery?lang=${subscription.language}`,
        alert_date_begin: beginDate.format('YYYY-MM-DD'),
        alert_date_end: endDate.format('YYYY-MM-DD'),
        ...bodyData
    };
};

export const mockGLADAllISOQuery = () => nock(config.get('dataApi.url'))
    .get('/dataset/gadm__integrated_alerts__iso_daily_alerts/latest/query')
    .query((data) => data.sql && data.sql.includes('iso = \'BRA\''))
    .matchHeader('x-api-key', config.get('dataApi.apiKey'))
    .matchHeader('origin', config.get('dataApi.origin'))
    .reply(200, {
        data: [
            {
                wdpa_protected_area__iucn_cat: 'Category 1',
                is__umd_regional_primary_forest_2001: false,
                is__peatland: false,
                is__ifl_intact_forest_landscape_2016: false,
                alert__count: 100,
                alert_area__ha: 10,
            },
            {
                wdpa_protected_area__iucn_cat: null,
                is__umd_regional_primary_forest_2001: true,
                is__peatland: false,
                is__ifl_intact_forest_landscape_2016: false,
                alert__count: 100,
                alert_area__ha: 10,
            },
            {
                wdpa_protected_area__iucn_cat: null,
                is__umd_regional_primary_forest_2001: false,
                is__peatland: true,
                is__ifl_intact_forest_landscape_2016: false,
                alert__count: 100,
                alert_area__ha: 10,
            },
            {
                wdpa_protected_area__iucn_cat: null,
                is__umd_regional_primary_forest_2001: false,
                is__peatland: false,
                is__ifl_intact_forest_landscape_2016: true,
                alert__count: 100,
                alert_area__ha: 10,
            }
        ],
        status: 'success'
    });

export const mockGLADAllAdm1Query = () => nock(config.get('dataApi.url'))
    .get('/dataset/gadm__integrated_alerts__adm1_daily_alerts/latest/query')
    .query((data) => data.sql && data.sql.includes('iso = \'BRA\'') && data.sql.includes('adm1 = \'1\''))
    .matchHeader('x-api-key', config.get('dataApi.apiKey'))
    .matchHeader('origin', config.get('dataApi.origin'))
    .reply(200, {
        data: [
            {
                wdpa_protected_area__iucn_cat: 'Category 1',
                is__umd_regional_primary_forest_2001: false,
                is__peatland: false,
                is__ifl_intact_forest_landscape_2016: false,
                alert__count: 100,
                alert_area__ha: 10,
            },
            {
                wdpa_protected_area__iucn_cat: null,
                is__umd_regional_primary_forest_2001: true,
                is__peatland: false,
                is__ifl_intact_forest_landscape_2016: false,
                alert__count: 100,
                alert_area__ha: 10,
            },
            {
                wdpa_protected_area__iucn_cat: null,
                is__umd_regional_primary_forest_2001: false,
                is__peatland: true,
                is__ifl_intact_forest_landscape_2016: false,
                alert__count: 100,
                alert_area__ha: 10,
            },
            {
                wdpa_protected_area__iucn_cat: null,
                is__umd_regional_primary_forest_2001: false,
                is__peatland: false,
                is__ifl_intact_forest_landscape_2016: true,
                alert__count: 100,
                alert_area__ha: 10,
            }
        ],
        status: 'success'
    });

export const mockGLADAllAdm2Query = () => nock(config.get('dataApi.url'))
    .get('/dataset/gadm__integrated_alerts__adm2_daily_alerts/latest/query')
    .query((data) => data.sql && data.sql.includes('iso = \'BRA\'') && data.sql.includes('adm1 = \'1\'') && data.sql.includes('adm2 = \'2\''))
    .matchHeader('x-api-key', config.get('dataApi.apiKey'))
    .matchHeader('origin', config.get('dataApi.origin'))
    .reply(200, {
        data: [
            {
                wdpa_protected_area__iucn_cat: 'Category 1',
                is__umd_regional_primary_forest_2001: false,
                is__peatland: false,
                is__ifl_intact_forest_landscape_2016: false,
                alert__count: 100,
                alert_area__ha: 10,
            },
            {
                wdpa_protected_area__iucn_cat: null,
                is__umd_regional_primary_forest_2001: true,
                is__peatland: false,
                is__ifl_intact_forest_landscape_2016: false,
                alert__count: 100,
                alert_area__ha: 10,
            },
            {
                wdpa_protected_area__iucn_cat: null,
                is__umd_regional_primary_forest_2001: false,
                is__peatland: true,
                is__ifl_intact_forest_landscape_2016: false,
                alert__count: 100,
                alert_area__ha: 10,
            },
            {
                wdpa_protected_area__iucn_cat: null,
                is__umd_regional_primary_forest_2001: false,
                is__peatland: false,
                is__ifl_intact_forest_landscape_2016: true,
                alert__count: 100,
                alert_area__ha: 10,
            }
        ],
        status: 'success'
    });

export const mockGLADAllWDPAQuery = () =>
    nock(config.get('dataApi.url'))
        .get('/dataset/wdpa_protected_areas__integrated_alerts__daily_alerts/latest/query')
        .query((data) => data.sql && data.sql.includes('wdpa_protected_area__id = \'1\''))
        .matchHeader('x-api-key', config.get('dataApi.apiKey'))
        .matchHeader('origin', config.get('dataApi.origin'))
        .reply(200, {
            data: [
                {
                    wdpa_protected_area__iucn_cat: 'Category 1',
                    is__umd_regional_primary_forest_2001: false,
                    is__peatland: false,
                    is__ifl_intact_forest_landscape_2016: false,
                    alert__count: 100,
                    alert_area__ha: 10,
                },
                {
                    wdpa_protected_area__iucn_cat: null,
                    is__umd_regional_primary_forest_2001: true,
                    is__peatland: false,
                    is__ifl_intact_forest_landscape_2016: false,
                    alert__count: 100,
                    alert_area__ha: 10,
                },
                {
                    wdpa_protected_area__iucn_cat: null,
                    is__umd_regional_primary_forest_2001: false,
                    is__peatland: true,
                    is__ifl_intact_forest_landscape_2016: false,
                    alert__count: 100,
                    alert_area__ha: 10,
                },
                {
                    wdpa_protected_area__iucn_cat: null,
                    is__umd_regional_primary_forest_2001: false,
                    is__peatland: false,
                    is__ifl_intact_forest_landscape_2016: true,
                    alert__count: 100,
                    alert_area__ha: 10,
                }
            ],
            status: 'success'
        });
export const mockGLADAllGeostoreQuery = (times: number = 1) =>
    nock(config.get('dataApi.url'))
        .get('/dataset/geostore__integrated_alerts__daily_alerts/latest/query')
        .query((data) => data.sql && data.sql.includes('geostore__id = \'423e5dfb0448e692f97b590c61f45f22\''))
        .matchHeader('x-api-key', config.get('dataApi.apiKey'))
        .matchHeader('origin', config.get('dataApi.origin'))
        .times(times)
        .reply(200, {
            data: [
                {
                    wdpa_protected_area__iucn_cat: 'Category 1',
                    is__umd_regional_primary_forest_2001: false,
                    is__peatland: false,
                    is__ifl_intact_forest_landscape_2016: false,
                    alert__count: 100,
                    alert_area__ha: 10,
                },
                {
                    wdpa_protected_area__iucn_cat: null,
                    is__umd_regional_primary_forest_2001: true,
                    is__peatland: false,
                    is__ifl_intact_forest_landscape_2016: false,
                    alert__count: 100,
                    alert_area__ha: 10,
                },
                {
                    wdpa_protected_area__iucn_cat: null,
                    is__umd_regional_primary_forest_2001: false,
                    is__peatland: true,
                    is__ifl_intact_forest_landscape_2016: false,
                    alert__count: 100,
                    alert_area__ha: 10,
                },
                {
                    wdpa_protected_area__iucn_cat: null,
                    is__umd_regional_primary_forest_2001: false,
                    is__peatland: false,
                    is__ifl_intact_forest_landscape_2016: true,
                    alert__count: 100,
                    alert_area__ha: 10,
                }
            ],
            status: 'success'
        });
