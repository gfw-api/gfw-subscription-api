import { ISubscription } from 'models/subscription';
import { ILayer } from 'models/layer';
import { BaseAlert } from 'types/analysis.type';
import { SubscriptionEmailData } from 'types/email.type';

export type FormattedPriorityArea = {
    intact_forest: string
    primary_forest: string
    peat: string
    protected_areas: string
    plantations: string
    other: string
};

export type PriorityArea = {
    intact_forest: number
    primary_forest: number
    peat: number
    protected_areas: number
    plantations: number
    other: number
};

export type PresenterData<T extends BaseAlert> = { value: number, data: T[] }

/**
 * alert_date_begin and alert_date_end seem to not be used in any of the
 * Sparkpost templates, and instead seem like legacy leftovers.
 * However, there are some tests requiring them, so removing them requires
 * additional validation. While I currently suspect that the tests were
 * implemented based on implemented behavior, rather than desired one,
 * validating and cleaning this up will be a task for another day
 */
export type PresenterResponse = {
    alert_date_begin: string
    alert_date_end: string
    alert_link: string
    alert_name: string
    dashboard_link: string
    help_center_url_investigate_alerts: string
    help_center_url_manage_areas: string
    help_center_url_save_more_areas: string
    layerSlug: string
    subscriptions_url: string
    unsubscribe_url: string
    value: number
}

export type ViirsPresenterResponse = PresenterResponse & {
    month: string
    year: string
    week_of: string
    week_start: string
    week_end: string
    viirs_count: number
    alert_count: number
    downloadUrls: { csv: string, json: string }
    priority_areas: PriorityArea
    formatted_alert_count: string
    formatted_priority_areas: FormattedPriorityArea
    viirs_frequency: string
    map_url_intact_forest: string
    map_url_primary_forest: string
    map_url_peat: string
    map_url_wdpa: string
}

export type MonthlySummaryPresenterResponse = PresenterResponse & {
    month: string
    year: string
    week_of: string
    week_start: string
    week_end: string
    glad_count: number
    viirs_count: number
    alert_count: number
    glad_alerts: PriorityArea
    viirs_alerts: PriorityArea
    priority_areas: PriorityArea
    viirs_days_count: number
    viirs_day_start: string
    viirs_day_end: string
    location: string
    formatted_alert_count: string
    formatted_glad_count: string
    formatted_viirs_count: string
    formatted_priority_areas: FormattedPriorityArea
    formatted_glad_priority_areas: FormattedPriorityArea
    formatted_viirs_priority_areas: FormattedPriorityArea
    glad_frequency: string
    viirs_frequency: string
}

export type GladAllPresenterResponse = PresenterResponse & {
    month: string
    year: string
    week_of: string
    week_start: string
    week_end: string
    glad_count: number
    alert_count: number
    priority_areas: PriorityArea
    formatted_alert_count: string
    formatted_priority_areas: FormattedPriorityArea
    map_url_intact_forest: string
    map_url_primary_forest: string
    map_url_peat: string
    map_url_wdpa: string
    area_ha_sum: string
    intact_forest_ha_sum: string
    primary_forest_ha_sum: string
    peat_ha_sum: string
    wdpa_ha_sum: string
    downloadUrls: { csv: string, json: string }
    glad_alert_type: string
}

export type GladS2PresenterResponse = GladAllPresenterResponse

export type GladRaddPresenterResponse = GladAllPresenterResponse

export type GladLPresenterResponse = GladAllPresenterResponse

export interface PresenterInterface<T extends BaseAlert> {
    transform(results: PresenterData<T>, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): Promise<PresenterResponse>
// =======
// //@todo confirm if alert_date_begin and alert_date_end are actually used anywhere
// export type PresenterResponse = {
//     alert_date_begin: string
//     alert_date_end: string
//     alert_link: string
//     alert_name: string
//     dashboard_link: string
//     help_center_url_investigate_alerts: string
//     help_center_url_manage_areas: string
//     help_center_url_save_more_areas: string
//     layerSlug: string
//     selected_area: string
//     subscriptions_url: string
//     unsubscribe_url: string
//     value: number
// }
//
// export type ViirsPresenterResponse = PresenterResponse & {
//     month: string
//     year: string
//     week_of: string
//     week_start: string
//     week_end: string
//     viirs_count: number
//     alert_count: number
//     downloadUrls: { csv: string, json: string }
//     priority_areas: PriorityArea
//     formatted_alert_count: string
//     formatted_priority_areas: FormattedPriorityArea
//     viirs_frequency: string
//     map_url_intact_forest: string
//     map_url_primary_forest: string
//     map_url_peat: string
//     map_url_wdpa: string
// }
//
// export type MonthlySummaryPresenterResponse = PresenterResponse & {
//     month: string
//     year: string
//     week_of: string
//     week_start: string
//     week_end: string
//     glad_count: number
//     viirs_count: number
//     alert_count: number
//     glad_alerts: PriorityArea
//     viirs_alerts: PriorityArea
//     priority_areas: PriorityArea
//     viirs_days_count: number
//     viirs_day_start: string
//     viirs_day_end: string
//     location: string
//     formatted_alert_count: string
//     formatted_glad_count: string
//     formatted_viirs_count: string
//     formatted_priority_areas: FormattedPriorityArea
//     formatted_glad_priority_areas: FormattedPriorityArea
//     formatted_viirs_priority_areas: FormattedPriorityArea
//     glad_frequency: string
//     viirs_frequency: string
// }
//
// export type GladAllPresenterResponse = PresenterResponse & {
//     month: string
//     year: string
//     week_of: string
//     week_start: string
//     week_end: string
//     glad_count: number
//     alert_count: number
//     priority_areas: PriorityArea
//     formatted_alert_count: string
//     formatted_priority_areas: FormattedPriorityArea
//     map_url_intact_forest: string
//     map_url_primary_forest: string
//     map_url_peat: string
//     map_url_wdpa: string
//     area_ha_sum: string
//     intact_forest_ha_sum: string
//     primary_forest_ha_sum: string
//     peat_ha_sum: string
//     wdpa_ha_sum: string
//     downloadUrls: { csv: string, json: string }
//     glad_alert_type: string
// }
//
// export type GladS2PresenterResponse = GladAllPresenterResponse
//
// export type GladRaddPresenterResponse = GladAllPresenterResponse
//
// export type GladLPresenterResponse = GladAllPresenterResponse
//
// export interface PresenterInterface<T extends BaseAlert> {
//     //@todo: set proper return type
//     transform(results: PresenterData<T>, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): Promise<PresenterResponse>
// >>>>>>> 6bfa38e (Refactor bulk of the code and tests to TS)
}
