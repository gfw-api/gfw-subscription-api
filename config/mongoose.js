const mongooseOptions = {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
    replSet: { readPreference: 'secondary' }
};

module.exports = mongooseOptions;
