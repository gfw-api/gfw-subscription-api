const mongooseOptions = {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
    readPreference: 'secondaryPreferred'
};

module.exports = mongooseOptions;
