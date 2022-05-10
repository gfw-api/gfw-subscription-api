import { PresenterInterface } from 'presenters/presenter.interface';
import MonthlySummaryPresenter from 'presenters/monthlySummaryPresenter';
import GLADLPresenter from 'presenters/gladLPresenter';
import GLADAllPresenter from 'presenters/gladAllPresenter';
import GLADS2Presenter from 'presenters/gladS2Presenter';
import GLADRaddPresenter from 'presenters/gladRaddPresenter';
import ViirsPresenter from 'presenters/viirsPresenter';
import DatasetPresenter from 'presenters/datasetPresenter';

export type EmailLanguageType = 'en' | 'es' | 'es-mx' | 'fr' | 'id' | 'pt' | 'pt-br' | 'zh'

export type EmailTemplates =
    'forest-fires-notification-viirs'
    | 'glad-updated-notification'
    | 'monthly-summary'
    | 'forest-change-notification'

export type SubscriptionEmailDataType =
     ForestFiresNotificationEmailData
    |  ForestFiresNotificationViirsEmailData
    |  GladUpdatedNotificationEmailData
    |  MonthlySummaryEmailData

export type ForestFiresNotificationEmailData = {
    alert_link: string
    alert_name: string
    area_ha_sum: string
    dashboard_link: string
    downloadUrls: {
        csv: string
    }
    glad_alert_type: string
    glad_count: string
    help_center_url_investigate_alerts: string
    help_center_url_manage_areas: string
    help_center_url_save_more_areas: string
    intact_forest_ha_sum: string
    map_url_intact_forest: string
    map_url_peat: string
    map_url_primary_forest: string
    map_url_wdpa: string
    peat_ha_sum: string
    primary_forest_ha_sum: string
    subscriptions_url: string
    unsubscribe_url: string
    wdpa_ha_sum: string
    week_end: string
    week_of: string
    week_start: string

}

export type ForestFiresNotificationViirsEmailData = {
    alert_link: string
    alert_name: string
    dashboard_link: string
    downloadUrls: {
        csv: string
    }
    formatted_alert_count: string
    formatted_priority_areas: {
        intact_forest: string
        primary_forest: string
        peat: string
        protected_areas: string
    }
    help_center_url_investigate_alerts: string
    help_center_url_manage_areas: string
    help_center_url_save_more_areas: string
    map_url_intact_forest: string
    map_url_peat: string
    map_url_primary_forest: string
    map_url_wdpa: string
    subscriptions_url: string
    tags: string
    unsubscribe_url: string
    viirs_count: string
    viirs_frequency: string
    week_end: string
    week_of: string
    week_start: string
}

export type GladUpdatedNotificationEmailData = {
    alert_link: string
    alert_name: string
    area_ha_sum: string
    dashboard_link: string
    downloadUrls: {
        csv: string
    }
    glad_alert_type: string
    glad_count: string
    help_center_url_investigate_alerts: string
    help_center_url_manage_areas: string
    help_center_url_save_more_areas: string
    intact_forest_ha_sum: string
    map_url_intact_forest: string
    map_url_peat: string
    map_url_primary_forest: string
    map_url_wdpa: string
    peat_ha_sum: string
    primary_forest_ha_sum: string
    subscriptions_url: string
    tags: string
    unsubscribe_url: string
    wdpa_ha_sum: string
    week_end: string
    week_of: string
    week_start: string
}

export type MonthlySummaryEmailData = {
    alert_link: string
    alert_name: string
    dashboard_link: string
    formatted_glad_priority_areas: {
        intact_forest: string
        primary_forest: string
        peat: string
        protected_areas: string
    }
    formatted_priority_areas: {
        intact_forest: string
        primary_forest: string
        peat: string
        protected_areas: string
        plantations: string
        other: string
        formatted_glad_count: string
    }
    formatted_viirs_count: string
    formatted_viirs_priority_areas: {
        intact_forest: string
        primary_forest: string
        peat: string
        protected_areas: string
    }
    glad_count: string
    glad_frequency: string
    month: string
    subscriptions_url: string
    tags: string
    unsubscribe_url: string
    viirs_count: string
    viirs_day_end: string
    viirs_day_start: string
    viirs_days_count: string
    viirs_frequency: string
    week_end: string
    week_of: string
    week_start: string
    year: string
}

export type EmailMap = {
    emailTemplate: EmailTemplates,
    presenter: PresenterInterface<any, any>
}

export type AlertType =
    'glad-alerts'
    | 'glad-all'
    | 'glad-l'
    | 'glad-radd'
    | 'glad-s2'
    | 'monthly-summary'
    | 'viirs-active-fires'

export const EMAIL_MAP: Record<AlertType | 'default', EmailMap> = {
    'default': {
        emailTemplate: 'forest-change-notification',
        presenter: DatasetPresenter
    },
    'glad-alerts': {
        emailTemplate: 'glad-updated-notification',
        presenter: GLADLPresenter
    },
    'glad-all': {
        emailTemplate: 'glad-updated-notification',
        presenter: GLADAllPresenter,
    },
    'glad-l': {
        emailTemplate: 'glad-updated-notification',
        presenter: GLADLPresenter,
    },
    'glad-radd': {
        emailTemplate: 'glad-updated-notification',
        presenter: GLADRaddPresenter,
    },
    'glad-s2': {
        emailTemplate: 'glad-updated-notification',
        presenter: GLADS2Presenter,
    },
    'monthly-summary': {
        emailTemplate: 'monthly-summary',
        presenter: MonthlySummaryPresenter,
    },
    'viirs-active-fires': {
        emailTemplate: 'forest-fires-notification-viirs',
        presenter: ViirsPresenter,
    }
}
