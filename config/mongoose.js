const mongooseOptions = {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
    db: {
        readPreference: 'secondaryPreferred'
    }
};

module.exports = mongooseOptions;
