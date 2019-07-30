/**
 * Load routers
 */
module.exports = (function () {
    const fs = require('fs');
    const routersPath = __dirname + '/routes';
    const queuesPath = __dirname + '/queues';
    const logger = require('logger');
    const mount = require('koa-mount');

    const loadAPI = function (app, path, pathApi) {
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
                loadAPI(app, newPath, newPathAPI);
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
    };

    const loadQueue = function (app, path) {
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
                loadQueue(app, newPath);
            }
        });
    };

    const loadRoutes = function (app) {
        logger.debug('Loading routes...');
        loadAPI(app, routersPath);
        loadQueue(app, queuesPath);
        logger.debug('Loaded routes correctly!');
    };

    return {
        loadRoutes: loadRoutes
    };

}());
