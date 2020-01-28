const mongoose = require('mongoose');

const { Schema } = mongoose;

const Statistic = new Schema({
    slug: { type: String, required: true, trim: true },
    application: { type: String, required: true, trim: true },
    createdAt: { type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model('Statistic', Statistic);
