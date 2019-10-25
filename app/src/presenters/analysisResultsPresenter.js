const moment = require('moment');
const _ = require('lodash');
const logger = require('logger');

const VIIRSPresenter = require('presenters/viirsPresenter'),
    GLADPresenter = require('presenters/gladPresenter'),
    TerraiPresenter = require('presenters/terraiPresenter'),
    StoryPresenter = require('presenters/storyPresenter'),
    ImazonPresenter = require('presenters/imazonPresenter'),
    FormaPresenter = require('presenters/formaPresenter'),
    Forma250GFWPresenter = require('presenters/forma250GFWPresenter');

const UrlService = require('services/urlService'),
    AlertUrlService = require('services/alertUrlService');

const PRESENTER_MAP = {
    'viirs-active-fires': VIIRSPresenter,
    'glad-alerts': GLADPresenter,
    'imazon-alerts': ImazonPresenter,
    'terrai-alerts': TerraiPresenter,
    'story': StoryPresenter,
    'forma-alerts': FormaPresenter,
    'forma250GFW': Forma250GFWPresenter,
};

const decorateWithName = function (results, subscription) {
    if (!_.isEmpty(subscription.name)) {
        results.alert_name = subscription.name;
    } else {
        results.alert_name = 'Unnamed Subscription';
    }

    return results;
};

const summaryForLayer = function (layer) {
    let meta = layer.meta;
    if (meta === undefined) {
        return '';
    }

    return '';
    //let updatePeriod = meta.updates.charAt(0).toUpperCase() + meta.updates.slice(1);
    //return `${meta.description} at a ${meta.resolution} resolution.
    //Coverage of ${meta.coverage}. Source is ${meta.source}.
    //Available data from ${meta.timescale}, updated ${updatePeriod}`;
};

const decorateWithMetadata = function (results, layer) {
    if (!layer.meta) {
        return results;
    }

    results.alert_type = layer.meta.description;
    results.alert_summary = summaryForLayer(layer);

    return results;
};

const decorateWithDates = function (results, begin, end) {
    begin = moment(begin).format('YYYY-MM-DD');
    end = moment(end).format('YYYY-MM-DD');
    results.alert_date_begin = begin;
    results.alert_date_end = end;

    return results;
};

const decorateWithLinks = function (results, subscription, layer, begin, end) {
    results.unsubscribe_url = UrlService.unsubscribeUrl(subscription);
    results.subscriptions_url = UrlService.flagshipUrl('/my-gfw');
    results.alert_link = AlertUrlService.generate(subscription, layer, begin, end);

    return results;
};

const decorateWithArea = function (results, subscription) {
    let params = subscription.params || {};

    if (params.iso && params.iso.country) {
        results.selected_area = `ISO Code: ${params.iso.country}`;

        if (params.iso.region) {
            results.selected_area += `, ID1: ${params.iso.region}`;
        }
    } else if (params.wdpaid) {
        results.selected_area = `WDPA ID: ${params.wdpaid}`;
    } else {
        results.selected_area = 'Custom Area';
    }

    return results;
};

class AnalysisResultsPresenter {
    static decorateWithConfig(results, layer) {
        return results;
    }

    static* render(results, subscription, layer, begin, end) {
        try {
            let Presenter = PRESENTER_MAP[layer.slug];

            if (Presenter) {
                results = yield Presenter.transform(results, layer, subscription, begin, end);
            }
            results.layerSlug = layer.slug;
            results = decorateWithName(results, subscription);
            results = decorateWithArea(results, subscription);
            results = decorateWithLinks(results, subscription, layer, begin, end);
            results = decorateWithMetadata(results, layer);
            results = decorateWithDates(results, begin, end);

            return results;
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }
}

module.exports = AnalysisResultsPresenter;
