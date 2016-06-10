/**
 * Load routers
 */
module.exports = (function () {
  'use strict';
  var fs = require('fs');
  var routersPath = __dirname + '/routes';
  var logger = require('logger');
  var mount = require('koa-mount');

  var loadAPI = function (app, path, pathApi) {
    var routesFiles = fs.readdirSync(path);
    var existIndexRouter = false;
    routesFiles.forEach(function (file) {
      if (/^\..*/.test(file)) { return; }

      var newPath = path ? (path + '/' + file) : file;
      var stat = fs.statSync(newPath);

      if(!stat.isDirectory()) {
        if(file.lastIndexOf('Router.js') !== -1) {
          if(file === 'indexRouter.js') {
            existIndexRouter = true;
          } else {
            logger.debug('Loading route %s, in path %s', newPath, pathApi);
            if(pathApi) {
              app.use(mount(pathApi, require(newPath).middleware()));
            } else {
              app.use(require(newPath).middleware());
            }
          }
        }
      } else {
        // is folder
        var newPathAPI = pathApi ? (pathApi + '/' + file) : '/' + file;
        loadAPI(app, newPath, newPathAPI);
      }
    });
    if(existIndexRouter) {
      // load indexRouter when finish other Router
      var newPath = path ? (path + '/indexRouter.js') : 'indexRouter.js';
      logger.debug('Loading route %s, in path %s', newPath, pathApi);
      if(pathApi) {
        app.use(mount(pathApi, require(newPath).middleware()));
      } else {
        app.use(require(newPath).middleware());
      }
    }
  };

  var loadQueue = function(app, path) {
    logger.debug('Loading queues...');
    var routesFiles = fs.readdirSync(path);
    var existIndexRouter = false;
    routesFiles.forEach(function(file) {
      if (/^\..*/.test(file)) { return; }

      var newPath = path ? (path + '/' + file) : file;
      var stat = fs.statSync(newPath);

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

  var loadRoutes = function (app) {
    logger.debug('Loading routes...');
    loadAPI(app, routersPath);
    loadQueue(app, routersPath);
    logger.debug('Loaded routes correctly!');
  };

  return {
    loadRoutes: loadRoutes
  };

}());
