var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Stadistic = new Schema({
    slug: { type: String, required: true, trim: true },
    createdAt: { type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model('Stadistic', Stadistic);
