'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Subscription = new Schema({
  name: {type: String, required: false, trim: true},
  confirmed: {type: Boolean, required: false, default: false},
  resource: {
    type: {type: String, trim: true, enum: ['EMAIL', 'URL'], default: 'EMAIL'},
    content: {type: String, trim: true}
  },
  layers: {type : Array , 'default' : []},
  geostoreId: {type: String, trim: true},
  userId: {type: String, trim: true},
  createdAt: {type: Date, required: false, default: Date.now},
  updateAt: {type: Date, required: false, default: Date.now},
});

module.exports = mongoose.model('Subscription', Subscription);
