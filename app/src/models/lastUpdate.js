var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LastUpdate = new Schema({
    dataset: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true }
});

module.exports = mongoose.model('LastUpdate', LastUpdate);
