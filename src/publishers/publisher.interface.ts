import { ISubscription } from 'models/subscription';
import { ILayer } from 'models/layer';
import { SubscriptionEmailData } from 'types/email.type';

export type PublisherData = {
    alert_link: string
    alert_name?: string
    dashboard_link: string
    downloadUrls?: {
        csv: string
        json: string
    }
    help_center_url_investigate_alerts?: string
    help_center_url_manage_areas?: string
    help_center_url_save_more_areas?: string
    map_url_intact_forest?: string
    map_url_peat?: string
    map_url_primary_forest?: string
    map_url_wdpa?: string
    subscriptions_url: string
    unsubscribe_url: string
}

export interface PublisherInterface {

    publish(subscription: ISubscription, results: PublisherData | SubscriptionEmailData, layer?: ILayer): Promise<void>
}
