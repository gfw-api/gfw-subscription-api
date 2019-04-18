const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Stadistic = new Schema({
    slug: { type: String, required: true, trim: true },
    createdAt: { type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model('Stadistic', Stadistic);
