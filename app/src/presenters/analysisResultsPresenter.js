const moment = require('moment');
const _ = require('lodash');
const logger = require('logger');

const VIIRSPresenter = require('presenters/viirsPresenter');
const MonthlySummaryPresenter = require('presenters/monthlySummaryPresenter');
const GLADAllPresenter = require('presenters/gladAllPresenter');
const GLADLPresenter = require('presenters/gladLPresenter');
const GLADRaddPresenter = require('presenters/gladRaddPresenter');
const GLADS2Presenter = require('presenters/gladS2Presenter');

const UrlService = require('services/urlService');

const PRESENTER_MAP = {
    'monthly-summary': MonthlySummaryPresenter,
    'viirs-active-fires': VIIRSPresenter,
    'glad-alerts': GLADLPresenter,
    'glad-all': GLADAllPresenter,
    'glad-l': GLADLPresenter,
    'glad-s2': GLADS2Presenter,
    'glad-radd': GLADRaddPresenter,
};

const decorateWithName = (results, subscription) => {
    if (!_.isEmpty(subscription.name)) {
        results.alert_name = subscription.name;
    } else {
        results.alert_name = 'Unnamed Subscription';
    }

    return results;
};

const summaryForLayer = (layer) => {
    const { meta } = layer;
    if (meta === undefined) {
        return '';
    }

    return '';
};

const decorateWithMetadata = (results, layer) => {
    if (!layer.meta) {
        return results;
    }

    results.alert_type = layer.meta.description;
    results.alert_summary = summaryForLayer(layer);

    return results;
};

const decorateWithDates = (results, begin, end) => {
    results.alert_date_begin = moment(begin).format('YYYY-MM-DD');
    results.alert_date_end = moment(end).format('YYYY-MM-DD');

    return results;
};

const decorateWithLinks = (results, subscription) => {
    results.unsubscribe_url = UrlService.unsubscribeUrl(subscription);
    results.subscriptions_url = UrlService.flagshipUrl('/my-gfw', subscription.language);

    // New Help Center links with language
    results.help_center_url_manage_areas = UrlService.flagshipUrl('/help/map/guides/manage-saved-areas', subscription.language);
    results.help_center_url_save_more_areas = UrlService.flagshipUrl('/help/map/guides/save-area-subscribe-forest-change-notifications', subscription.language);
    results.help_center_url_investigate_alerts = UrlService.flagshipUrl('/help/map/guides/investigate-forest-change-satellite-imagery', subscription.language);

    return results;
};

const decorateWithArea = (results, subscription) => {
    const params = subscription.params || {};

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

class AnalysisResultsPresenter {

    static decorateWithConfig(results) {
        return results;
    }

    static async render(results, subscription, layer, begin, end) {
        try {
            const Presenter = PRESENTER_MAP[layer.slug];

            if (Presenter) {
                // eslint-disable-next-line no-param-reassign
                results = await Presenter.transform(results, layer, subscription, begin, end);
            }
            results.layerSlug = layer.slug;
            // eslint-disable-next-line no-param-reassign
            results = decorateWithName(results, subscription);
            // eslint-disable-next-line no-param-reassign
            results = decorateWithArea(results, subscription);
            // eslint-disable-next-line no-param-reassign
            results = decorateWithLinks(results, subscription);
            // eslint-disable-next-line no-param-reassign
            results = decorateWithMetadata(results, layer);
            // eslint-disable-next-line no-param-reassign
            results = decorateWithDates(results, begin, end);

            return results;
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }

}

module.exports = AnalysisResultsPresenter;
