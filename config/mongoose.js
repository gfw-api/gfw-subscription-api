const mongooseOptions = {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
    readPreference: 'secondaryPreferred', // Has MongoDB prefer secondary servers for read operations.
    appname: 'subscriptions', // Displays the app name in MongoDB logs, for ease of debug
    serverSelectionTimeoutMS: 10000 // Number of miliseconds the underlying MongoDB driver has to pick a server

};

module.exports = mongooseOptions;
