const moment = require('moment');
const _ = require('lodash');
const logger = require('logger');

const VIIRSPresenter = require('presenters/viirsPresenter');
const GLADPresenter = require('presenters/gladPresenter');
const TerraiPresenter = require('presenters/terraiPresenter');
const StoryPresenter = require('presenters/storyPresenter');
const ImazonPresenter = require('presenters/imazonPresenter');
const FormaPresenter = require('presenters/formaPresenter');
const Forma250GFWPresenter = require('presenters/forma250GFWPresenter');

const UrlService = require('services/urlService');
const AlertUrlService = require('services/alertUrlService');
const ImageService = require('services/imageService');

const PRESENTER_MAP = {
    'viirs-active-fires': VIIRSPresenter,
    'glad-alerts': GLADPresenter,
    'imazon-alerts': ImazonPresenter,
    'terrai-alerts': TerraiPresenter,
    story: StoryPresenter,
    'forma-alerts': FormaPresenter,
    forma250GFW: Forma250GFWPresenter,
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
    // let updatePeriod = meta.updates.charAt(0).toUpperCase() + meta.updates.slice(1);
    // return `${meta.description} at a ${meta.resolution} resolution.
    // Coverage of ${meta.coverage}. Source is ${meta.source}.
    // Available data from ${meta.timescale}, updated ${updatePeriod}`;
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

const decorateWithLinks = (results, subscription, layer, begin, end) => {
    results.unsubscribe_url = UrlService.unsubscribeUrl(subscription);
    results.subscriptions_url = UrlService.flagshipUrl('/my_gfw/subscriptions');
    results.alert_link = AlertUrlService.generate(subscription, layer, begin, end);

    return results;
};

const decorateWithArea = (results, subscription) => {
    const params = subscription.params || {};

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

const decorateWithCustomImage = async (results, subscription) => {
    results.image_url = await ImageService.getStaticMapImageUrl(subscription);
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
            results = decorateWithLinks(results, subscription, layer, begin, end);
            // eslint-disable-next-line no-param-reassign
            results = decorateWithMetadata(results, layer);
            // eslint-disable-next-line no-param-reassign
            results = decorateWithDates(results, begin, end);

            try {
                // eslint-disable-next-line no-param-reassign
                results = await decorateWithCustomImage(results, subscription);
            } catch (err) {
                logger.error('Error generating custom image for subscription: ', err);
            }

            return results;
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }

}

module.exports = AnalysisResultsPresenter;
