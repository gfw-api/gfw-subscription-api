const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const { Schema } = mongoose;
const logger = require('logger');

const ALERT_TYPES = ['EMAIL', 'URL'];
const alertPublishers = {};
ALERT_TYPES.forEach((type) => {
    // eslint-disable-next-line import/no-dynamic-require
    alertPublishers[type] = require(`publishers/${type.toLowerCase()}Publisher`);
});

const Layer = require('models/layer');
const AnalysisService = require('services/analysisService');
const AnalysisResultsAdapter = require('adapters/analysisResultsAdapter');
const AnalysisResultsPresenter = require('presenters/analysisResultsPresenter');
const Statistic = require('models/statistic');

const Subscription = new Schema({
    name: { type: String, required: false, trim: true },
    confirmed: { type: Boolean, required: false, default: false },
    resource: {
        type: {
            type: String, trim: true, enum: ALERT_TYPES, default: ALERT_TYPES[0]
        },
        content: { type: String, trim: true }
    },
    datasets: { type: Array, default: [] },
    datasetsQuery: [{
        _id: false,
        id: { type: String, required: false, trim: true },
        type: { type: String, required: false, trim: true },
        lastSentDate: { type: Date, required: true, default: Date.now },
        threshold: { type: Number, required: false, default: 0 },
        historical: [{
            _id: false,
            value: { type: Number, required: false },
            date: { type: Date, required: true, default: Date.now }
        }]
    }],
    params: { type: Schema.Types.Mixed, default: {} },
    userId: { type: String, trim: true, required: false },
    language: {
        type: String, trim: true, required: false, default: 'en'
    },
    createdAt: { type: Date, required: true, default: Date.now },
    updateAt: { type: Date, required: false, default: Date.now },
    application: {
        type: String, required: true, default: 'gfw', trim: true
    },
    env: { type: String, required: true, default: 'production' }
});

// this cant be converted to an arrow function, as it will change the behavior of things and cause tests to rightfully fail
// eslint-disable-next-line func-names
Subscription.methods.publish = async function (layerConfig, begin, end, sendEmail = true) {
    logger.info('Publishing subscription with data', layerConfig, begin, end);
    const layer = await Layer.findBySlug(layerConfig.name);
    if (!layer) {
        return null;
    }

    let results = await AnalysisService.execute(this, layerConfig.slug, begin, end);
    if (!results) {
        logger.info('Results are null. Returning');
        return null;
    }
    logger.debug('Results obtained', results);
    results = AnalysisResultsAdapter.transform(results, layer);
    if (AnalysisResultsAdapter.isZero(results)) {
        logger.info('Zero value result, not sending subscription');
        return false;
    }

    results = await AnalysisResultsPresenter.render(
        results, this, layer, begin, end
    );

    if (sendEmail) {
        await alertPublishers[this.resource.type].publish(this, results, layer);
        logger.info('Saving statistic');
        await new Statistic({ slug: layerConfig.slug, application: this.application }).save();
    }

    return true;
};

Subscription.plugin(mongoosePaginate);

module.exports = mongoose.model('Subscription', Subscription);
