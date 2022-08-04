import moment, { Moment } from 'moment';
import config from 'config';
import qs from 'qs';

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
                        number_of_days: beginDate.diff(endDate, 'days')
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
        value: 500,
        month: beginDate.format('MMMM'),
        year: beginDate.format('YYYY'),
        week_of: beginDate.format('DD MMM'),
        week_start: beginDate.format('DD/MM/YYYY'),
        week_end: endDate.format('DD/MM/YYYY'),
        glad_count: 400,
        viirs_count: 100,
        alert_count: 500,
        glad_alerts: {
            intact_forest: 100,
            primary_forest: 100,
            peat: 100,
            protected_areas: 100,
            plantations: 0,
            other: 0
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
            intact_forest: 100,
            primary_forest: 100,
            peat: 100,
            protected_areas: 150,
            plantations: 0,
            other: 50
        },
        viirs_days_count: endDate.diff(beginDate, 'days'),
        viirs_day_start: beginDate.format('DD/MM/YYYY'),
        viirs_day_end: endDate.format('DD/MM/YYYY'),
        location: subscription.name,
        formatted_alert_count: "500",
        formatted_glad_count: "400",
        formatted_viirs_count: "100",
        formatted_priority_areas: {
            intact_forest: "100",
            primary_forest: "100",
            peat: "100",
            protected_areas: "150",
            plantations: "0",
            other: "50"
        },
        formatted_glad_priority_areas: {
            intact_forest: "100",
            primary_forest: "100",
            peat: "100",
            protected_areas: "100",
            plantations: "0",
            other: "0"
        },
        formatted_viirs_priority_areas: {
            intact_forest: "0",
            primary_forest: "0",
            peat: "0",
            protected_areas: "50",
            plantations: "0",
            other: "50"
        },
        glad_frequency: "average",
        viirs_frequency: "average",
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
    }
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
                        number_of_days: moment(beginDate).diff(moment(endDate), 'days')
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
        value: 500,
        month: beginDate.format('MMMM'),
        year: beginDate.format('YYYY'),
        week_of: beginDate.format('DD MMM'),
        week_start: beginDate.format('DD/MM/YYYY'),
        week_end: endDate.format('DD/MM/YYYY'),
        glad_count: 400,
        viirs_count: 100,
        alert_count: 500,
        glad_alerts: {
            intact_forest: 100,
            primary_forest: 100,
            peat: 100,
            protected_areas: 100,
            plantations: 0,
            other: 0
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
            intact_forest: 100,
            primary_forest: 175,
            peat: 100,
            protected_areas: 100,
            plantations: 0,
            other: 25
        },
        viirs_days_count: endDate.diff(beginDate, 'days'),
        viirs_day_start: beginDate.format('DD/MM/YYYY'),
        viirs_day_end: endDate.format('DD/MM/YYYY'),
        location: subscription.name,
        formatted_alert_count: "500",
        formatted_glad_count: "400",
        formatted_viirs_count: "100",
        formatted_priority_areas: {
            intact_forest: "100",
            primary_forest: "175",
            peat: "100",
            protected_areas: "100",
            plantations: "0",
            other: "25"
        },
        formatted_glad_priority_areas: {
            intact_forest: "100",
            primary_forest: "100",
            peat: "100",
            protected_areas: "100",
            plantations: "0",
            other: "0"
        },
        formatted_viirs_priority_areas: {
            intact_forest: "0",
            primary_forest: "75",
            peat: "0",
            protected_areas: "0",
            plantations: "0",
            other: "25"
        },
        glad_frequency: "average",
        viirs_frequency: "average",
        alert_link: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(alertLinkQueryString)}`,
        dashboard_link: `${config.get('gfw.flagshipUrl')}/dashboards/aoi/${subscription.id}?lang=${subscription.language}&category=forest-change&utm_source=hyperlink&utm_medium=email&utm_campaign=MonthlyAlertSummary`,
        layerSlug: 'monthly-summary',
        alert_name: subscription.name,
        selected_area: 'ISO Code: BRA',
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
                        number_of_days: moment(beginDate).diff(moment(endDate), 'days')
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
        value: 500,
        month: beginDate.format('MMMM'),
        year: beginDate.format('YYYY'),
        week_of: beginDate.format('DD MMM'),
        week_start: beginDate.format('DD/MM/YYYY'),
        week_end: endDate.format('DD/MM/YYYY'),
        glad_count: 400,
        viirs_count: 100,
        alert_count: 500,
        glad_alerts: {
            intact_forest: 100,
            primary_forest: 100,
            peat: 100,
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
            intact_forest: 100,
            primary_forest: 125,
            peat: 100,
            protected_areas: 200,
            plantations: 0,
            other: 0
        },
        viirs_days_count: 31,
        viirs_day_start: beginDate.format('DD/MM/YYYY'),
        viirs_day_end: endDate.format('DD/MM/YYYY'),
        location: subscription.name,
        formatted_alert_count: "500",
        formatted_glad_count: "400",
        formatted_viirs_count: "100",
        formatted_priority_areas: {
            intact_forest: "100",
            primary_forest: "125",
            peat: "100",
            protected_areas: "200",
            plantations: "0",
            other: "0"
        },
        formatted_glad_priority_areas: {
            intact_forest: "100",
            primary_forest: "100",
            peat: "100",
            protected_areas: "100",
            plantations: "0",
            other: "0"
        },
        formatted_viirs_priority_areas: {
            intact_forest: "0",
            primary_forest: "25",
            peat: "0",
            protected_areas: "100",
            plantations: "0",
            other: "0"
        },
        glad_frequency: "average",
        viirs_frequency: "average",
        alert_link: `${config.get('gfw.flagshipUrl')}/map/aoi/${subscription.id}?${qs.stringify(alertLinkQueryString)}`,
        dashboard_link: `${config.get('gfw.flagshipUrl')}/dashboards/aoi/${subscription.id}?lang=${subscription.language}&category=forest-change&utm_source=hyperlink&utm_medium=email&utm_campaign=MonthlyAlertSummary`,
        layerSlug: 'monthly-summary',
        alert_name: subscription.name,
        selected_area: 'ISO Code: BRA',
        unsubscribe_url: `${config.get('apiGateway.externalUrl')}/v1/subscriptions/${subscription.id}/unsubscribe?redirect=true&lang=${subscription.language}`,
        subscriptions_url: `${config.get('gfw.flagshipUrl')}/my-gfw?lang=${subscription.language}`,
        help_center_url_manage_areas: `${config.get('gfw.flagshipUrl')}/help/map/guides/manage-saved-areas?lang=${subscription.language}`,
        help_center_url_save_more_areas: `${config.get('gfw.flagshipUrl')}/help/map/guides/save-area-subscribe-forest-change-notifications?lang=${subscription.language}`,
        help_center_url_investigate_alerts: `${config.get('gfw.flagshipUrl')}/help/map/guides/investigate-forest-change-satellite-imagery?lang=${subscription.language}`,
        alert_date_begin: beginDate.format('YYYY-MM-DD'),
        alert_date_end: endDate.format('YYYY-MM-DD'),
        ...bodyData
    }
};
