// @ts-ignore
import btoa from 'btoa';
import qs from 'qs';
import config from 'config';
import { Moment } from 'moment';

export const createGLADAlertsWDPAURLSubscriptionBody = (subscription: Record<string, any>, beginDate: Moment, endDate: Moment, bodyData: Record<string, any> = {}) => {
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
        map: btoa(JSON.stringify(
            {
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

            }
        )),
        mainMap: btoa(JSON.stringify({
            showAnalysis: true
        }))
    };
    const alertLinkQueryString = {
        lang: subscription.language,
        map: btoa(JSON.stringify(
            {
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
            }
        )),
        mainMap: btoa(JSON.stringify({
            showAnalysis: true
        }))
    };

    return {
        value: 100,
        month: beginDate.format('MMMM'),
        year: beginDate.format('YYYY'),
        week_of: beginDate.format('DD MMM'),
        week_start: beginDate.format('DD/MM/YYYY'),
        week_end: endDate.format('DD/MM/YYYY'),
        glad_count: 100,
        alert_count: 100,
        priority_areas: {
            intact_forest: 0,
            other: 0,
            peat: 0,
            plantations: 0,
            primary_forest: 0,
            protected_areas: 100,
        },
        formatted_alert_count: '100',
        formatted_priority_areas: {
            intact_forest: '0',
            other: '0',
            peat: '0',
            plantations: '0',
            primary_forest: '0',
            protected_areas: '100',
        },
        alert_link: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(alertLinkQueryString)}`,
        dashboard_link: `${config.get('gfw.flagshipUrl')}/dashboards/aoi/${subscription.id}?lang=${subscription.language}&category=forest-change&utm_source=hyperlink&utm_medium=email&utm_campaign=ForestChangeAlert`,
        map_url_intact_forest: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLIntactForestQueryString)}`,
        map_url_primary_forest: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLPrimaryForestQueryString)}`,
        map_url_peat: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLPeatQueryString)}`,
        map_url_wdpa: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLWDPAQueryString)}`,
        area_ha_sum: '3.5',
        intact_forest_ha_sum: '0',
        primary_forest_ha_sum: '0',
        peat_ha_sum: '0',
        wdpa_ha_sum: '3.5',
        downloadUrls: {
            csv: `${config.get('dataApi.url')}/dataset/umd_glad_landsat_alerts/latest/download/csv?sql=SELECT latitude, longitude, umd_glad_landsat_alerts__date, umd_glad_landsat_alerts__confidence FROM data WHERE umd_glad_landsat_alerts__date >= '${beginDate.format('YYYY-MM-DD')}' AND umd_glad_landsat_alerts__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_origin=rw&geostore_id=f98f505878dcee72a2e92e7510a07d6f`,
            json: `${config.get('dataApi.url')}/dataset/umd_glad_landsat_alerts/latest/download/json?sql=SELECT latitude, longitude, umd_glad_landsat_alerts__date, umd_glad_landsat_alerts__confidence FROM data WHERE umd_glad_landsat_alerts__date >= '${beginDate.format('YYYY-MM-DD')}' AND umd_glad_landsat_alerts__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_origin=rw&geostore_id=f98f505878dcee72a2e92e7510a07d6f`
        },
        glad_alert_type: 'GLAD-L deforestation alerts',
        layerSlug: 'glad-alerts',
        alert_name: subscription.name,
        selected_area: 'WDPA ID: 1',
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

export const createGLADAlertsISOURLSubscriptionBody = (subscription: Record<string, any>, beginDate: Moment, endDate: Moment, bodyData: Record<string, any> = {}) => {
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
        map: btoa(JSON.stringify(
            {
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

            }
        )),
        mainMap: btoa(JSON.stringify({
            showAnalysis: true
        }))
    };
    const alertLinkQueryString = {
        lang: subscription.language,
        map: btoa(JSON.stringify(
            {
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
            }
        )),
        mainMap: btoa(JSON.stringify({
            showAnalysis: true
        }))
    };

    return {
        value: 100,
        month: beginDate.format('MMMM'),
        year: beginDate.format('YYYY'),
        week_of: beginDate.format('DD MMM'),
        week_start: beginDate.format('DD/MM/YYYY'),
        week_end: endDate.format('DD/MM/YYYY'),
        glad_count: 100,
        alert_count: 100,
        priority_areas: {
            intact_forest: 0,
            primary_forest: 60,
            peat: 0,
            protected_areas: 20,
            plantations: 0,
            other: 20
        },
        formatted_alert_count: '100',
        formatted_priority_areas: {
            intact_forest: '0',
            primary_forest: '60',
            peat: '0',
            protected_areas: '20',
            plantations: '0',
            other: '20'
        },
        alert_link: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(alertLinkQueryString)}`,
        dashboard_link: `${config.get('gfw.flagshipUrl')}/dashboards/aoi/${subscription.id}?lang=${subscription.language}&category=forest-change&utm_source=hyperlink&utm_medium=email&utm_campaign=ForestChangeAlert`,
        map_url_intact_forest: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLIntactForestQueryString)}`,
        map_url_primary_forest: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLPrimaryForestQueryString)}`,
        map_url_peat: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLPeatQueryString)}`,
        map_url_wdpa: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLWDPAQueryString)}`,
        area_ha_sum: '20.5',
        intact_forest_ha_sum: '0',
        primary_forest_ha_sum: '18.54',
        peat_ha_sum: '0',
        wdpa_ha_sum: '0.08',
        downloadUrls: {
            csv: `${config.get('dataApi.url')}/dataset/umd_glad_landsat_alerts/latest/download/csv?sql=SELECT latitude, longitude, umd_glad_landsat_alerts__date, umd_glad_landsat_alerts__confidence FROM data WHERE umd_glad_landsat_alerts__date >= '${beginDate.format('YYYY-MM-DD')}' AND umd_glad_landsat_alerts__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_origin=rw&geostore_id=f98f505878dcee72a2e92e7510a07d6f`,
            json: `${config.get('dataApi.url')}/dataset/umd_glad_landsat_alerts/latest/download/json?sql=SELECT latitude, longitude, umd_glad_landsat_alerts__date, umd_glad_landsat_alerts__confidence FROM data WHERE umd_glad_landsat_alerts__date >= '${beginDate.format('YYYY-MM-DD')}' AND umd_glad_landsat_alerts__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_origin=rw&geostore_id=f98f505878dcee72a2e92e7510a07d6f`
        },
        glad_alert_type: 'GLAD-L deforestation alerts',
        layerSlug: 'glad-alerts',
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

export const createGLADAlertsGeostoreURLSubscriptionBody = (subscription: Record<string, any>, beginDate: Moment, endDate: Moment, bodyData: Record<string, any> = {}) => {
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
        map: btoa(JSON.stringify(
            {
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

            }
        )),
        mainMap: btoa(JSON.stringify({
            showAnalysis: true
        }))
    };
    const alertLinkQueryString = {
        lang: subscription.language,
        map: btoa(JSON.stringify(
            {
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
            }
        )),
        mainMap: btoa(JSON.stringify({
            showAnalysis: true
        }))
    };

    return {
        value: 100,
        month: beginDate.format('MMMM'),
        year: beginDate.format('YYYY'),
        week_of: beginDate.format('DD MMM'),
        week_start: beginDate.format('DD/MM/YYYY'),
        week_end: endDate.format('DD/MM/YYYY'),
        glad_count: 100,
        alert_count: 100,
        priority_areas: {
            intact_forest: 0,
            primary_forest: 0,
            peat: 0,
            protected_areas: 50,
            plantations: 0,
            other: 50
        },
        formatted_alert_count: '100',
        formatted_priority_areas: {
            intact_forest: '0',
            primary_forest: '0',
            peat: '0',
            protected_areas: '50',
            plantations: '0',
            other: '50'
        },
        alert_link: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(alertLinkQueryString)}`,
        dashboard_link: `${config.get('gfw.flagshipUrl')}/dashboards/aoi/${subscription.id}?lang=${subscription.language}&category=forest-change&utm_source=hyperlink&utm_medium=email&utm_campaign=ForestChangeAlert`,
        map_url_intact_forest: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLIntactForestQueryString)}`,
        map_url_primary_forest: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLPrimaryForestQueryString)}`,
        map_url_peat: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLPeatQueryString)}`,
        map_url_wdpa: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLWDPAQueryString)}`,
        area_ha_sum: '5.86',
        intact_forest_ha_sum: '0',
        primary_forest_ha_sum: '0',
        peat_ha_sum: '0',
        wdpa_ha_sum: '3.73',
        downloadUrls: {
            csv: `${config.get('dataApi.url')}/dataset/umd_glad_landsat_alerts/latest/download/csv?sql=SELECT latitude, longitude, umd_glad_landsat_alerts__date, umd_glad_landsat_alerts__confidence FROM data WHERE umd_glad_landsat_alerts__date >= '${beginDate.format('YYYY-MM-DD')}' AND umd_glad_landsat_alerts__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_origin=rw&geostore_id=423e5dfb0448e692f97b590c61f45f22`,
            json: `${config.get('dataApi.url')}/dataset/umd_glad_landsat_alerts/latest/download/json?sql=SELECT latitude, longitude, umd_glad_landsat_alerts__date, umd_glad_landsat_alerts__confidence FROM data WHERE umd_glad_landsat_alerts__date >= '${beginDate.format('YYYY-MM-DD')}' AND umd_glad_landsat_alerts__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_origin=rw&geostore_id=423e5dfb0448e692f97b590c61f45f22`
        },
        glad_alert_type: 'GLAD-L deforestation alerts',
        layerSlug: 'glad-alerts',
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

export const createMonthlySummaryGeostoreURLSubscriptionBody = (subscription: Record<string, any>, beginDate: Moment, endDate: Moment, bodyData: Record<string, any> = {}) => {
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
                    dataset: 'fire-alerts-viirs',
                    layers: [
                        'fire-alerts-viirs'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    },
                    params: {
                        number_of_days: -30
                    }
                },
                {
                    dataset: '0b0208b6-b424-4b57-984f-caddfa25ba22',
                    layers: [
                        'b45350e3-5a76-44cd-b0a9-5038a0d8bfae',
                        'cc35432d-38d7-4a03-872e-3a71a2f555fc'
                    ]
                }
            ]
        })),
        mainMap: btoa(JSON.stringify({
            showAnalysis: true
        }))
    };

    return {
        value: 200,
        month: beginDate.format('MMMM'),
        year: beginDate.format('YYYY'),
        week_of: beginDate.format('DD MMM'),
        week_start: beginDate.format('DD/MM/YYYY'),
        week_end: endDate.format('DD/MM/YYYY'),
        glad_count: 100,
        viirs_count: 100,
        alert_count: 200,
        glad_alerts: {
            intact_forest: 0,
            primary_forest: 0,
            peat: 0,
            protected_areas: 50,
            plantations: 0,
            other: 50
        },
        viirs_alerts: {
            intact_forest: 0,
            primary_forest: 0,
            peat: 0,
            protected_areas: 50,
            plantations: 0,
            other: 50
        },
        priority_areas: {
            intact_forest: 0,
            primary_forest: 0,
            peat: 0,
            protected_areas: 100,
            plantations: 0,
            other: 100
        },
        viirs_days_count: 30,
        viirs_day_start: beginDate.format('DD/MM/YYYY'),
        viirs_day_end: endDate.format('DD/MM/YYYY'),
        location: subscription.name,
        formatted_alert_count: '200',
        formatted_glad_count: '100',
        formatted_viirs_count: '100',
        formatted_priority_areas: {
            intact_forest: '0',
            primary_forest: '0',
            peat: '0',
            protected_areas: '100',
            plantations: '0',
            other: '100'
        },
        formatted_glad_priority_areas: {
            intact_forest: '0',
            primary_forest: '0',
            peat: '0',
            protected_areas: '50',
            plantations: '0',
            other: '50'
        },
        formatted_viirs_priority_areas: {
            intact_forest: '0',
            primary_forest: '0',
            peat: '0',
            protected_areas: '50',
            plantations: '0',
            other: '50'
        },
        glad_frequency: 'average',
        viirs_frequency: 'average',
        alert_link: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(alertLinkQueryString)}`,
        dashboard_link: `${config.get('gfw.flagshipUrl')}/dashboards/aoi/${subscription.id}?lang=${subscription.language}&category=forest-change&utm_source=hyperlink&utm_medium=email&utm_campaign=MonthlyAlertSummary`,
        layerSlug: 'monthly-summary',
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

export const createMonthlySummaryISOURLSubscriptionBody = (subscription: Record<string, any>, beginDate: Moment, endDate: Moment, bodyData: Record<string, any> = {}) => {
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
                    dataset: 'fire-alerts-viirs',
                    layers: [
                        'fire-alerts-viirs'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    },
                    params: {
                        number_of_days: -30
                    }
                },
                {
                    dataset: '0b0208b6-b424-4b57-984f-caddfa25ba22',
                    layers: [
                        'b45350e3-5a76-44cd-b0a9-5038a0d8bfae',
                        'cc35432d-38d7-4a03-872e-3a71a2f555fc'
                    ]
                }
            ]
        })),
        mainMap: btoa(JSON.stringify({
            showAnalysis: true
        }))
    };

    return {
        value: 200,
        month: beginDate.format('MMMM'),
        year: beginDate.format('YYYY'),
        week_of: beginDate.format('DD MMM'),
        week_start: beginDate.format('DD/MM/YYYY'),
        week_end: endDate.format('DD/MM/YYYY'),
        glad_count: 100,
        viirs_count: 100,
        alert_count: 200,
        glad_alerts: {
            intact_forest: 0,
            primary_forest: 60,
            peat: 0,
            protected_areas: 20,
            plantations: 0,
            other: 20
        },
        viirs_alerts: {
            intact_forest: 0,
            primary_forest: 75,
            peat: 0,
            protected_areas: 0,
            plantations: 0,
            other: 25
        },
        priority_areas: {
            intact_forest: 0,
            primary_forest: 135,
            peat: 0,
            protected_areas: 20,
            plantations: 0,
            other: 45
        },
        viirs_days_count: 30,
        viirs_day_start: beginDate.format('DD/MM/YYYY'),
        viirs_day_end: endDate.format('DD/MM/YYYY'),
        location: subscription.name,
        formatted_alert_count: '200',
        formatted_glad_count: '100',
        formatted_viirs_count: '100',
        formatted_priority_areas: {
            intact_forest: '0',
            primary_forest: '135',
            peat: '0',
            protected_areas: '20',
            plantations: '0',
            other: '45'
        },
        formatted_glad_priority_areas: {
            intact_forest: '0',
            primary_forest: '60',
            peat: '0',
            protected_areas: '20',
            plantations: '0',
            other: '20'
        },
        formatted_viirs_priority_areas: {
            intact_forest: '0',
            primary_forest: '75',
            peat: '0',
            protected_areas: '0',
            plantations: '0',
            other: '25'
        },
        glad_frequency: 'average',
        viirs_frequency: 'average',
        alert_link: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(alertLinkQueryString)}`,
        dashboard_link: `${config.get('gfw.flagshipUrl')}/dashboards/aoi/${subscription.id}?lang=${subscription.language}&category=forest-change&utm_source=hyperlink&utm_medium=email&utm_campaign=MonthlyAlertSummary`,
        layerSlug: 'monthly-summary',
        alert_name: subscription.name,
        selected_area: 'ISO Code: IDN',
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

export const createMonthlySummaryWDPAURLSubscriptionBody = (subscription: Record<string, any>, beginDate: Moment, endDate: Moment, bodyData: Record<string, any> = {}) => {
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
                    dataset: 'fire-alerts-viirs',
                    layers: [
                        'fire-alerts-viirs'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    },
                    params: {
                        number_of_days: -30
                    }
                },
                {
                    dataset: '0b0208b6-b424-4b57-984f-caddfa25ba22',
                    layers: [
                        'b45350e3-5a76-44cd-b0a9-5038a0d8bfae',
                        'cc35432d-38d7-4a03-872e-3a71a2f555fc'
                    ]
                }
            ]
        })),
        mainMap: btoa(JSON.stringify({
            showAnalysis: true
        }))
    };

    return {
        value: 200,
        month: beginDate.format('MMMM'),
        year: beginDate.format('YYYY'),
        week_of: beginDate.format('DD MMM'),
        week_start: beginDate.format('DD/MM/YYYY'),
        week_end: endDate.format('DD/MM/YYYY'),
        glad_count: 100,
        viirs_count: 100,
        alert_count: 200,
        glad_alerts: {
            intact_forest: 0,
            primary_forest: 0,
            peat: 0,
            protected_areas: 100,
            plantations: 0,
            other: 0
        },
        viirs_alerts: {
            intact_forest: 0,
            primary_forest: 25,
            peat: 0,
            protected_areas: 100,
            plantations: 0,
            other: 0
        },
        priority_areas: {
            intact_forest: 0,
            primary_forest: 25,
            peat: 0,
            protected_areas: 200,
            plantations: 0,
            other: 0
        },
        viirs_days_count: 30,
        viirs_day_start: beginDate.format('DD/MM/YYYY'),
        viirs_day_end: endDate.format('DD/MM/YYYY'),
        location: subscription.name,
        formatted_alert_count: '200',
        formatted_glad_count: '100',
        formatted_viirs_count: '100',
        formatted_priority_areas: {
            intact_forest: '0',
            primary_forest: '25',
            peat: '0',
            protected_areas: '200',
            plantations: '0',
            other: '0'
        },
        formatted_glad_priority_areas: {
            intact_forest: '0',
            primary_forest: '0',
            peat: '0',
            protected_areas: '100',
            plantations: '0',
            other: '0'
        },
        formatted_viirs_priority_areas: {
            intact_forest: '0',
            primary_forest: '25',
            peat: '0',
            protected_areas: '100',
            plantations: '0',
            other: '0'
        },
        glad_frequency: 'average',
        viirs_frequency: 'average',
        alert_link: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(alertLinkQueryString)}`,
        dashboard_link: `${config.get('gfw.flagshipUrl')}/dashboards/aoi/${subscription.id}?lang=${subscription.language}&category=forest-change&utm_source=hyperlink&utm_medium=email&utm_campaign=MonthlyAlertSummary`,
        layerSlug: 'monthly-summary',
        alert_name: subscription.name,
        selected_area: 'ISO Code: IDN',
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

export const createViirsFireAlertsGeostoreURLSubscriptionBody = (subscription: Record<string, any>, beginDate: Moment, endDate: Moment, bodyData: Record<string, any> = {}) => {
    const mapURLIntactForestQueryString = {
        lang: subscription.language,
        map: btoa(JSON.stringify({
            canBound: true,
            datasets: [
                {
                    dataset: 'fire-alerts-viirs',
                    layers: [
                        'fire-alerts-viirs'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    },
                    params: {
                        number_of_days: -7
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
                    dataset: 'fire-alerts-viirs',
                    layers: [
                        'fire-alerts-viirs'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    },
                    params: {
                        number_of_days: -7
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
                    dataset: 'fire-alerts-viirs',
                    layers: [
                        'fire-alerts-viirs'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    },
                    params: {
                        number_of_days: -7
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
                    dataset: 'fire-alerts-viirs',
                    layers: [
                        'fire-alerts-viirs'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    },
                    params: {
                        number_of_days: -7
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
                    dataset: 'fire-alerts-viirs',
                    layers: [
                        'fire-alerts-viirs'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    },
                    params: {
                        number_of_days: -7
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
        value: 100,
        month: beginDate.format('MMMM'),
        year: beginDate.format('YYYY'),
        week_of: beginDate.format('DD MMM'),
        week_start: beginDate.format('DD/MM/YYYY'),
        week_end: endDate.format('DD/MM/YYYY'),
        viirs_count: 100,
        alert_count: 100,
        downloadUrls: {
            csv: `${config.get('dataApi.url')}/dataset/nasa_viirs_fire_alerts/latest/download/csv?sql=SELECT latitude, longitude, alert__date, confidence__cat, is__ifl_intact_forest_landscape_2016 as in_intact_forest, is__umd_regional_primary_forest_2001 as in_primary_forest, is__peatland as in_peat, CASE WHEN wdpa_protected_area__iucn_cat <> '' THEN 'True' ELSE 'False' END as in_protected_areas FROM nasa_viirs_fire_alerts WHERE alert__date > '${beginDate.format('YYYY-MM-DD')}' AND alert__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_id=423e5dfb0448e692f97b590c61f45f22&geostore_origin=rw`,
            json: `${config.get('dataApi.url')}/dataset/nasa_viirs_fire_alerts/latest/download/json?sql=SELECT latitude, longitude, alert__date, confidence__cat, is__ifl_intact_forest_landscape_2016 as in_intact_forest, is__umd_regional_primary_forest_2001 as in_primary_forest, is__peatland as in_peat, CASE WHEN wdpa_protected_area__iucn_cat <> '' THEN 'True' ELSE 'False' END as in_protected_areas FROM nasa_viirs_fire_alerts WHERE alert__date > '${beginDate.format('YYYY-MM-DD')}' AND alert__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_id=423e5dfb0448e692f97b590c61f45f22&geostore_origin=rw`
        },
        priority_areas: {
            intact_forest: 0,
            primary_forest: 0,
            peat: 0,
            protected_areas: 50,
            plantations: 0,
            other: 50
        },
        formatted_alert_count: '100',
        formatted_priority_areas: {
            intact_forest: '0',
            primary_forest: '0',
            peat: '0',
            protected_areas: '50',
            plantations: '0',
            other: '50'
        },
        viirs_frequency: 'average',
        alert_link: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(alertLinkQueryString)}`,
        dashboard_link: `${config.get('gfw.flagshipUrl')}/dashboards/aoi/${subscription.id}?lang=${subscription.language}&category=fires&utm_source=hyperlink&utm_medium=email&utm_campaign=FireAlert`,
        map_url_intact_forest: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLIntactForestQueryString)}`,
        map_url_primary_forest: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLPrimaryForestQueryString)}`,
        map_url_peat: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLPeatQueryString)}`,
        map_url_wdpa: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLWDPAQueryString)}`,
        layerSlug: 'viirs-active-fires',
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

export const createViirsFireAlertsISOURLSubscriptionBody = (subscription: Record<string, any>, beginDate: Moment, endDate: Moment, bodyData: Record<string, any> = {}) => {
    const mapURLIntactForestQueryString = {
        lang: subscription.language,
        map: btoa(JSON.stringify({
            canBound: true,
            datasets: [
                {
                    dataset: 'fire-alerts-viirs',
                    layers: [
                        'fire-alerts-viirs'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    },
                    params: {
                        number_of_days: -7
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
                    dataset: 'fire-alerts-viirs',
                    layers: [
                        'fire-alerts-viirs'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    },
                    params: {
                        number_of_days: -7
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
                    dataset: 'fire-alerts-viirs',
                    layers: [
                        'fire-alerts-viirs'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    },
                    params: {
                        number_of_days: -7
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
                    dataset: 'fire-alerts-viirs',
                    layers: [
                        'fire-alerts-viirs'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    },
                    params: {
                        number_of_days: -7
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
                    dataset: 'fire-alerts-viirs',
                    layers: [
                        'fire-alerts-viirs'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    },
                    params: {
                        number_of_days: -7
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
        value: 100,
        month: beginDate.format('MMMM'),
        year: beginDate.format('YYYY'),
        week_of: beginDate.format('DD MMM'),
        week_start: beginDate.format('DD/MM/YYYY'),
        week_end: endDate.format('DD/MM/YYYY'),
        viirs_count: 100,
        alert_count: 100,
        downloadUrls: {
            csv: `${config.get('dataApi.url')}/dataset/nasa_viirs_fire_alerts/latest/download/csv?sql=SELECT latitude, longitude, alert__date, confidence__cat, is__ifl_intact_forest_landscape_2016 as in_intact_forest, is__umd_regional_primary_forest_2001 as in_primary_forest, is__peatland as in_peat, CASE WHEN wdpa_protected_area__iucn_cat <> '' THEN 'True' ELSE 'False' END as in_protected_areas FROM nasa_viirs_fire_alerts WHERE alert__date > '${beginDate.format('YYYY-MM-DD')}' AND alert__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_id=f98f505878dcee72a2e92e7510a07d6f&geostore_origin=rw`,
            json: `${config.get('dataApi.url')}/dataset/nasa_viirs_fire_alerts/latest/download/json?sql=SELECT latitude, longitude, alert__date, confidence__cat, is__ifl_intact_forest_landscape_2016 as in_intact_forest, is__umd_regional_primary_forest_2001 as in_primary_forest, is__peatland as in_peat, CASE WHEN wdpa_protected_area__iucn_cat <> '' THEN 'True' ELSE 'False' END as in_protected_areas FROM nasa_viirs_fire_alerts WHERE alert__date > '${beginDate.format('YYYY-MM-DD')}' AND alert__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_id=f98f505878dcee72a2e92e7510a07d6f&geostore_origin=rw`
        },
        priority_areas: {
            intact_forest: 0,
            primary_forest: 75,
            peat: 0,
            protected_areas: 0,
            plantations: 0,
            other: 25
        },
        formatted_alert_count: '100',
        formatted_priority_areas: {
            intact_forest: '0',
            primary_forest: '75',
            peat: '0',
            protected_areas: '0',
            plantations: '0',
            other: '25'
        },
        viirs_frequency: 'average',
        alert_link: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(alertLinkQueryString)}`,
        dashboard_link: `${config.get('gfw.flagshipUrl')}/dashboards/aoi/${subscription.id}?lang=${subscription.language}&category=fires&utm_source=hyperlink&utm_medium=email&utm_campaign=FireAlert`,
        map_url_intact_forest: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLIntactForestQueryString)}`,
        map_url_primary_forest: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLPrimaryForestQueryString)}`,
        map_url_peat: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLPeatQueryString)}`,
        map_url_wdpa: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLWDPAQueryString)}`,
        layerSlug: 'viirs-active-fires',
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

export const createViirsFireAlertsWDPAURLSubscriptionBody = (subscription: Record<string, any>, beginDate: Moment, endDate: Moment, bodyData: Record<string, any> = {}) => {
    const mapURLIntactForestQueryString = {
        lang: subscription.language,
        map: btoa(JSON.stringify({
            canBound: true,
            datasets: [
                {
                    dataset: 'fire-alerts-viirs',
                    layers: [
                        'fire-alerts-viirs'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    },
                    params: {
                        number_of_days: -7
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
                    dataset: 'fire-alerts-viirs',
                    layers: [
                        'fire-alerts-viirs'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    },
                    params: {
                        number_of_days: -7
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
                    dataset: 'fire-alerts-viirs',
                    layers: [
                        'fire-alerts-viirs'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    },
                    params: {
                        number_of_days: -7
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
                    dataset: 'fire-alerts-viirs',
                    layers: [
                        'fire-alerts-viirs'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    },
                    params: {
                        number_of_days: -7
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
                    dataset: 'fire-alerts-viirs',
                    layers: [
                        'fire-alerts-viirs'
                    ],
                    timelineParams: {
                        startDateAbsolute: beginDate.format('YYYY-MM-DD'),
                        endDateAbsolute: endDate.format('YYYY-MM-DD'),
                        startDate: beginDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD'),
                        trimEndDate: endDate.format('YYYY-MM-DD')
                    },
                    params: {
                        number_of_days: -7
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
        value: 100,
        month: beginDate.format('MMMM'),
        year: beginDate.format('YYYY'),
        week_of: beginDate.format('DD MMM'),
        week_start: beginDate.format('DD/MM/YYYY'),
        week_end: endDate.format('DD/MM/YYYY'),
        viirs_count: 100,
        alert_count: 100,
        downloadUrls: {
            csv: `${config.get('dataApi.url')}/dataset/nasa_viirs_fire_alerts/latest/download/csv?sql=SELECT latitude, longitude, alert__date, confidence__cat, is__ifl_intact_forest_landscape_2016 as in_intact_forest, is__umd_regional_primary_forest_2001 as in_primary_forest, is__peatland as in_peat, CASE WHEN wdpa_protected_area__iucn_cat <> '' THEN 'True' ELSE 'False' END as in_protected_areas FROM nasa_viirs_fire_alerts WHERE alert__date > '${beginDate.format('YYYY-MM-DD')}' AND alert__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_id=f98f505878dcee72a2e92e7510a07d6f&geostore_origin=rw`,
            json: `${config.get('dataApi.url')}/dataset/nasa_viirs_fire_alerts/latest/download/json?sql=SELECT latitude, longitude, alert__date, confidence__cat, is__ifl_intact_forest_landscape_2016 as in_intact_forest, is__umd_regional_primary_forest_2001 as in_primary_forest, is__peatland as in_peat, CASE WHEN wdpa_protected_area__iucn_cat <> '' THEN 'True' ELSE 'False' END as in_protected_areas FROM nasa_viirs_fire_alerts WHERE alert__date > '${beginDate.format('YYYY-MM-DD')}' AND alert__date <= '${endDate.format('YYYY-MM-DD')}'&geostore_id=f98f505878dcee72a2e92e7510a07d6f&geostore_origin=rw`
        },
        priority_areas: {
            intact_forest: 0,
            primary_forest: 25,
            peat: 0,
            protected_areas: 100,
            plantations: 0,
            other: 0
        },
        formatted_alert_count: '100',
        formatted_priority_areas: {
            intact_forest: '0',
            primary_forest: '25',
            peat: '0',
            protected_areas: '100',
            plantations: '0',
            other: '0'
        },
        viirs_frequency: 'average',
        alert_link: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(alertLinkQueryString)}`,
        dashboard_link: `${config.get('gfw.flagshipUrl')}/dashboards/aoi/${subscription.id}?lang=${subscription.language}&category=fires&utm_source=hyperlink&utm_medium=email&utm_campaign=FireAlert`,
        map_url_intact_forest: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLIntactForestQueryString)}`,
        map_url_primary_forest: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLPrimaryForestQueryString)}`,
        map_url_peat: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLPeatQueryString)}`,
        map_url_wdpa: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(mapURLWDPAQueryString)}`,
        layerSlug: 'viirs-active-fires',
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
