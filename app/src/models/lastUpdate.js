const mongoose = require('mongoose');

const { Schema } = mongoose;

const LastUpdate = new Schema({
    dataset: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true }
});

module.exports = mongoose.model('LastUpdate', LastUpdate);
