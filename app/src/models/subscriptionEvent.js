var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var logger = require('logger');

var SubscriptionEvent = new Schema({
    name: { type: String, required: false, trim: true },
    begin: { type: Date, required: true, default: Date.now },
    end: { type: Date, required: true, default: Date.now }
}, {
    timestamps: true
});

SubscriptionEvent.statics.latestForDataset = function (dataset) {
    var Model = mongoose.model('SubscriptionEvent', SubscriptionEvent);
    return this.findOne().sort({ created_at: -1 }).exec().then(function (event) {
        if (event) {
            return new Model({
                begin: event.end,
                end: Date.now()
            }).save();
        } else {
            return new Model({
                begin: Date.now(),
                end: Date.now()
            }).save();
        }
    }).then(null, function (err) {
        throw new Error(err);
    });
};

module.exports = mongoose.model('SubscriptionEvent', SubscriptionEvent);
