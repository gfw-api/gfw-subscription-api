const mongoose = require('mongoose');

const { Schema } = mongoose;

const SubscriptionEvent = new Schema({
    name: { type: String, required: false, trim: true },
    begin: { type: Date, required: true, default: Date.now },
    end: { type: Date, required: true, default: Date.now }
}, {
    timestamps: true
});

SubscriptionEvent.statics.latestForDataset = () => {
    const Model = mongoose.model('SubscriptionEvent', SubscriptionEvent);
    return this.findOne().sort({ created_at: -1 }).exec().then((event) => {
        if (event) {
            return new Model({
                begin: event.end,
                end: Date.now()
            }).save();
        }
        return new Model({
            begin: Date.now(),
            end: Date.now()
        }).save();

    })
        .then(null, (err) => {
            throw new Error(err);
        });
};

module.exports = mongoose.model('SubscriptionEvent', SubscriptionEvent);
