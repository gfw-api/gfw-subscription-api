const mongooseOptions = {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
    readPreference: 'secondary'
};

module.exports = mongooseOptions;
