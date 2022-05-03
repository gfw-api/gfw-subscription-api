import logger from 'logger';

import VIIRSPresenter from 'presenters/viirsPresenter';
import MonthlySummaryPresenter from 'presenters/monthlySummaryPresenter';
import GLADAllPresenter from 'presenters/gladAllPresenter';
import GLADLPresenter from 'presenters/gladLPresenter';
import GLADRaddPresenter from 'presenters/gladRaddPresenter';
import GLADS2Presenter from 'presenters/gladS2Presenter';

import UrlService from 'services/urlService';
import { ISubscription } from 'models/subscription';
import { PresenterData, PresenterInterface } from 'presenters/presenter.interface';
import { ILayer } from 'models/layer';
import { BaseAlert } from 'types/analysis.type';
import { isEmpty } from 'lodash';
import { AlertType, EMAIL_MAP, EmailMap, SubscriptionEmailData } from 'types/email.type';
import moment from 'moment';

const PRESENTER_MAP: Record<AlertType, PresenterInterface<BaseAlert>> = {
    'monthly-summary': MonthlySummaryPresenter,
    'viirs-active-fires': VIIRSPresenter,
    'glad-alerts': GLADLPresenter,
    'glad-all': GLADAllPresenter,
    'glad-l': GLADLPresenter,
    'glad-s2': GLADS2Presenter,
    'glad-radd': GLADRaddPresenter,
};

const decorateWithName = (results: SubscriptionEmailData, subscription: ISubscription): SubscriptionEmailData => {
    if (!isEmpty(subscription.name)) {
        results.alert_name = subscription.name;
    } else {
        results.alert_name = 'Unnamed Subscription';
    }

    return results;
};


const decorateWithLinks = (results: SubscriptionEmailData, subscription: ISubscription): SubscriptionEmailData => {
    results.unsubscribe_url = UrlService.unsubscribeUrl(subscription);
    results.subscriptions_url = UrlService.flagshipUrl('/my-gfw', subscription.language);

    // New Help Center links with language
    results.help_center_url_manage_areas = UrlService.flagshipUrl('/help/map/guides/manage-saved-areas', subscription.language);
    results.help_center_url_save_more_areas = UrlService.flagshipUrl('/help/map/guides/save-area-subscribe-forest-change-notifications', subscription.language);
    results.help_center_url_investigate_alerts = UrlService.flagshipUrl('/help/map/guides/investigate-forest-change-satellite-imagery', subscription.language);

    return results;
};

const decorateWithArea = (results: SubscriptionEmailData, subscription: ISubscription): SubscriptionEmailData => {
    const params:Record<string, any> = subscription.params || {};

    if (params.iso && params.iso.country) {
        results.selected_area = `ISO Code: ${params.iso.country}`;

        if (params.iso.region) {
            results.selected_area += `, ID1: ${params.iso.region}`;

            if (params.iso.subregion) {
                results.selected_area += `, ID2: ${params.iso.subregion}`;
            }
        }
    } else if (params.wdpaid) {
        results.selected_area = `WDPA ID: ${params.wdpaid}`;
    } else {
        results.selected_area = 'Custom Area';
    }

    return results;
};

const decorateWithMetadata = (results: SubscriptionEmailData, layer: ILayer) => {
    if (!layer.meta) {
        return results;
    }

    const summaryForLayer = (layer: ILayer): string => {
        const { meta } = layer;
        if (meta === undefined) {
            return '';
        }

        return '';
    };

    results.alert_type = layer.meta.description;
    results.alert_summary = summaryForLayer(layer);

    return results;
};

const decorateWithDates = (results: SubscriptionEmailData, begin: Date, end: Date) => {
    results.alert_date_begin = moment(begin).format('YYYY-MM-DD');
    results.alert_date_end = moment(end).format('YYYY-MM-DD');

    return results;
};

class AnalysisResultsPresenter {

    static async render(results: PresenterData<BaseAlert>, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): Promise<SubscriptionEmailData> {
        try {

            const emailMap: EmailMap = EMAIL_MAP[layer.slug] || EMAIL_MAP['default'];
            const emailDataType: SubscriptionEmailData = emailMap.emailDataType;
            const Presenter: PresenterInterface<BaseAlert> = PRESENTER_MAP[layer.slug];

            let presenterResponse: typeof emailDataType;
            if (Presenter) {
                presenterResponse = await Presenter.transform(results, subscription, layer, begin, end);
            } else {
                /**
                 * @todo: this "else" clause was introduced as part of the refactoring process
                 * I strongly suspect it makes sense within the app's business logic
                 * but it should be confirmed with proper testing nonetheless
                 */
                throw new Error(`No presenter found for layer ${layer.slug}`);
            }

            presenterResponse.layerSlug = layer.slug;
            // eslint-disable-next-line no-param-reassign
            presenterResponse = decorateWithName(presenterResponse, subscription);
            // eslint-disable-next-line no-param-reassign
            presenterResponse = decorateWithArea(presenterResponse, subscription);
            // eslint-disable-next-line no-param-reassign
            presenterResponse = decorateWithLinks(presenterResponse, subscription);
            // eslint-disable-next-line no-param-reassign
            presenterResponse = decorateWithMetadata(presenterResponse, layer);
            // eslint-disable-next-line no-param-reassign
            presenterResponse = decorateWithDates(presenterResponse, begin, end);

            // presenterResponse.layerSlug = layer.slug;
            // presenterResponse = decorateWithName(presenterResponse, subscription);
            // presenterResponse = decorateWithLinks(presenterResponse, subscription);

            return presenterResponse;
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }

}

export default AnalysisResultsPresenter;
