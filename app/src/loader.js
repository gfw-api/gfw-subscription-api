/* eslint-disable import/no-dynamic-require */
const fs = require('fs');

const routersPath = `${__dirname}/routes`;
const queuesPath = `${__dirname}/queues`;
const logger = require('logger');
const mount = require('koa-mount');

module.exports = (() => {
    const loadAPI = (app, path = routersPath, pathApi) => {
        const routesFiles = fs.readdirSync(path);
        let existIndexRouter = false;
        routesFiles.forEach((file) => {
            const newPath = path ? (`${path}/${file}`) : file;
            const stat = fs.statSync(newPath);
            if (!stat.isDirectory()) {
                if (file.lastIndexOf('.router.js') !== -1) {
                    if (file === 'index.router.js') {
                        existIndexRouter = true;
                    } else {
                        logger.debug('Loading route %s, in path %s', newPath, pathApi);
                        if (pathApi) {
                            app.use(mount(pathApi, require(newPath).middleware()));
                        } else {
                            app.use(require(newPath).middleware());
                        }
                    }
                }
            } else {
                // is folder
                const newPathAPI = pathApi ? (`${pathApi}/${file}`) : `/${file}`;
                loadAPI(app, newPath, newPathAPI);
            }
        });
        if (existIndexRouter) {
            // load indexRouter when finish other Router
            const newPath = path ? (`${path}/index.router.js`) : 'index.router.js';
            logger.debug('Loading route %s, in path %s', newPath, pathApi);
            if (pathApi) {
                app.use(mount(pathApi, require(newPath).middleware()));
            } else {
                app.use(require(newPath).middleware());
            }
        }
    };

    const loadQueues = (app, path = queuesPath) => {
        logger.info('Loading queues...');
        const routesFiles = fs.readdirSync(path);
        routesFiles.forEach((file) => {
            if (/^\..*/.test(file)) {
                return;
            }

            const newPath = path ? (`${path}/${file}`) : file;
            const stat = fs.statSync(newPath);

            if (!stat.isDirectory()) {
                if (file.lastIndexOf('.queue.js') !== -1) {
                    logger.info('Loading queue %s', newPath);
                    const QueueClass = require(newPath);
                    // eslint-disable-next-line no-new
                    new QueueClass();
                }
            } else {
                // is folder
                loadQueues(app, newPath);
            }
        });
        logger.info('Loaded routes correctly!');
    };

    const loadRoutes = (app) => {
        logger.info('Loading routes...');
        loadAPI(app, routersPath);
        logger.info('Loaded routes correctly!');
    };

    return {
        loadRoutes,
        loadQueues
    };

})();
