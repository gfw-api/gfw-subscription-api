const mongooseOptions = {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
    readPreference: 'secondaryPreferred',
    db: {
        readPreference: 'secondaryPreferred'
    }
};

module.exports = mongooseOptions;
