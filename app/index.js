const logger = require('logger');
require('app')().then(() => {
    logger.info('Server running');
}, (err) => {
    logger.error('Error running server', err);
});
