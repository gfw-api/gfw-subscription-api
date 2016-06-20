'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const ALERT_TYPES = ['EMAIL', 'URL'];
var alertPublishers = {};
ALERT_TYPES.forEach(function(type) {
  var typePublisher = require('publishers/' + type.toLowerCase() + 'Publisher');
  alertPublishers[type] = typePublisher;
});

var Layer = require('models/layer');

var Subscription = new Schema({
  name: {type: String, required: false, trim: true},
  confirmed: {type: Boolean, required: false, default: false},
  resource: {
    type: {type: String, trim: true, enum: ALERT_TYPES, default: ALERT_TYPES[0]},
    content: {type: String, trim: true}
  },
  layers: {type : Array , 'default' : []},
  geostoreId: {type: String, trim: true},
  userId: {type: String, trim: true},
  createdAt: {type: Date, required: false, default: Date.now},
  updateAt: {type: Date, required: false, default: Date.now},
});

Subscription.methods.publish = function*(layerConfig, begin, end) {
  var layer = yield Layer.findBySlug(layerConfig.name);
  // AnalysisService.execute(layerSlug, begin, end)
  // alertPublishers[this.resource.type].publish(subscription, layer, analysis_results)
};

module.exports = mongoose.model('Subscription', Subscription);
