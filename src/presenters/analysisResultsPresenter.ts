import logger from 'logger';

import VIIRSPresenter from 'presenters/viirsPresenter';
import MonthlySummaryPresenter from 'presenters/monthlySummaryPresenter';
import GLADAllPresenter from 'presenters/gladAllPresenter';
import GLADLPresenter from 'presenters/gladLPresenter';
import GLADRaddPresenter from 'presenters/gladRaddPresenter';
import GLADS2Presenter from 'presenters/gladS2Presenter';

import UrlService from 'services/urlService';
import { ISubscription } from 'models/subscription';
import { PresenterData, PresenterInterface, PresenterResponse } from 'presenters/presenter.interface';
import { ILayer } from 'models/layer';
import { BaseAlert } from 'types/analysis.type';
import { isEmpty } from 'lodash';
import moment from 'moment';

const PRESENTER_MAP: Record<string, PresenterInterface<BaseAlert>> = {
    'monthly-summary': MonthlySummaryPresenter,
    'viirs-active-fires': VIIRSPresenter,
    'glad-alerts': GLADLPresenter,
    'glad-all': GLADAllPresenter,
    'glad-l': GLADLPresenter,
    'glad-s2': GLADS2Presenter,
    'glad-radd': GLADRaddPresenter,
};

const decorateWithName = (results: PresenterResponse, subscription: ISubscription): PresenterResponse => {
    if (!isEmpty(subscription.name)) {
        results.alert_name = subscription.name;
    } else {
        results.alert_name = 'Unnamed Subscription';
    }

    return results;
};

// const decorateWithMetadata = (results: PresenterResponse, layer: ILayer): PresenterResponse => {
//     if (!layer.meta) {
//         return results;
//     }
//
//     results.alert_type = layer.meta.description;
//     results.alert_summary = '';
//
//     return results;
// };

const decorateWithDates = (results: PresenterResponse, begin: Date, end: Date): PresenterResponse => {
    results.alert_date_begin = moment(begin).format('YYYY-MM-DD');
    results.alert_date_end = moment(end).format('YYYY-MM-DD');

    return results;
};

const decorateWithLinks = (results: PresenterResponse, subscription: ISubscription): PresenterResponse => {
    results.unsubscribe_url = UrlService.unsubscribeUrl(subscription);
    results.subscriptions_url = UrlService.flagshipUrl('/my-gfw', subscription.language);

    // New Help Center links with language
    results.help_center_url_manage_areas = UrlService.flagshipUrl('/help/map/guides/manage-saved-areas', subscription.language);
    results.help_center_url_save_more_areas = UrlService.flagshipUrl('/help/map/guides/save-area-subscribe-forest-change-notifications', subscription.language);
    results.help_center_url_investigate_alerts = UrlService.flagshipUrl('/help/map/guides/investigate-forest-change-satellite-imagery', subscription.language);

    return results;
};

// const decorateWithArea = (results: PresenterResponse, subscription: ISubscription): PresenterResponse => {
//     const params: Record<string, any> = subscription.params || {};
//
//     if (params.iso && params.iso.country) {
//         results.selected_area = `ISO Code: ${params.iso.country}`;
//
//         if (params.iso.region) {
//             results.selected_area += `, ID1: ${params.iso.region}`;
//
//             if (params.iso.subregion) {
//                 results.selected_area += `, ID2: ${params.iso.subregion}`;
//             }
//         }
//     } else if (params.wdpaid) {
//         results.selected_area = `WDPA ID: ${params.wdpaid}`;
//     } else {
//         results.selected_area = 'Custom Area';
//     }
//
//     return results;
// };

class AnalysisResultsPresenter {

    static async render(results: PresenterData<BaseAlert>, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): Promise<PresenterResponse> {
        try {
            const Presenter: PresenterInterface<BaseAlert> = PRESENTER_MAP[layer.slug];
            let presenterResponse: PresenterResponse;
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
            presenterResponse = decorateWithName(presenterResponse, subscription);
            // presenterResponse = decorateWithArea(presenterResponse, subscription);
            presenterResponse = decorateWithLinks(presenterResponse, subscription);
            // presenterResponse = decorateWithMetadata(presenterResponse, layer);
            presenterResponse = decorateWithDates(presenterResponse, begin, end);

            return presenterResponse;
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }

}

export default AnalysisResultsPresenter;
