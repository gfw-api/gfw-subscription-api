'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var logger = require('logger');

const ALERT_TYPES = ['EMAIL', 'URL'];
var alertPublishers = {};
ALERT_TYPES.forEach(function(type) {
  var typePublisher = require('publishers/' + type.toLowerCase() + 'Publisher');
  alertPublishers[type] = typePublisher;
});

var Layer = require('models/layer');
var AnalysisService = require('services/analysisService');
var AnalysisResultsAdapter = require('adapters/analysisResultsAdapter');
var AnalysisResultsPresenter = require('presenters/analysisResultsPresenter');

var Subscription = new Schema({
  name: {type: String, required: false, trim: true},
  confirmed: {type: Boolean, required: false, default: false},
  resource: {
    type: {type: String, trim: true, enum: ALERT_TYPES, default: ALERT_TYPES[0]},
    content: {type: String, trim: true}
  },
  datasets: {type: Array, 'default' : []},
  params: {type: Schema.Types.Mixed, default: {}},
  userId: {type: String, trim: true, required: false},
  createdAt: {type: Date, required: false, default: Date.now},
  updateAt: {type: Date, required: false, default: Date.now},
});

Subscription.methods.publish = function*(layerConfig, begin, end) {
  logger.info('Publishing subscription with data', layerConfig, begin, end);
  var layer = yield Layer.findBySlug(layerConfig.name);
  if (!layer) { return; }

  var results = yield AnalysisService.execute(
    this, layerConfig.slug, begin, end);
  logger.debug('Results obtained', results);
  results = AnalysisResultsAdapter.transform(results, layer);
  if (AnalysisResultsAdapter.isZero(results)) { return; }

  results = yield AnalysisResultsPresenter.render(
    results, this, layer, begin, end);

  alertPublishers[this.resource.type].publish(this, results, layer);

  console.log('Results');
  console.log(results);
};

module.exports = mongoose.model('Subscription', Subscription);
