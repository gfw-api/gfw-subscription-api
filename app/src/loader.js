/**
 * Load routers
 */
module.exports = (function () {
    const fs = require('fs');
    const routersPath = __dirname + '/routes';
    const queuesPath = __dirname + '/queues';
    const logger = require('logger');
    const mount = require('koa-mount');

    const loadRoutes = function (app, path = routersPath, pathApi) {
        logger.debug('Loading routes...');
        const routesFiles = fs.readdirSync(path);
        let existIndexRouter = false;
        routesFiles.forEach(function (file) {
            if (/^\..*/.test(file)) {
                return;
            }

            const newPath = path ? (path + '/' + file) : file;
            const stat = fs.statSync(newPath);

            if (!stat.isDirectory()) {
                if (file.lastIndexOf('Router.js') !== -1) {
                    if (file === 'indexRouter.js') {
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
                const newPathAPI = pathApi ? (pathApi + '/' + file) : '/' + file;
                loadRoutes(app, newPath, newPathAPI);
            }
        });
        if (existIndexRouter) {
            // load indexRouter when finish other Router
            const newPath = path ? (path + '/indexRouter.js') : 'indexRouter.js';
            logger.debug('Loading route %s, in path %s', newPath, pathApi);
            if (pathApi) {
                app.use(mount(pathApi, require(newPath).middleware()));
            } else {
                app.use(require(newPath).middleware());
            }
        }

        logger.debug('Loaded routes correctly!');
    };

    const loadQueues = function (app, path = queuesPath) {
        logger.debug('Loading queues...');
        const routesFiles = fs.readdirSync(path);
        routesFiles.forEach(function (file) {
            if (/^\..*/.test(file)) {
                return;
            }

            const newPath = path ? (path + '/' + file) : file;
            const stat = fs.statSync(newPath);

            if (!stat.isDirectory()) {
                if (file.lastIndexOf('Queue.js') !== -1) {
                    logger.debug('Loading queue %s', newPath);
                    require(newPath);
                }
            } else {
                // is folder
                loadQueues(app, newPath);
            }
        });
        logger.debug('Loaded routes correctly!');
    };

    return {
        loadRoutes,
        loadQueues
    };

}());
