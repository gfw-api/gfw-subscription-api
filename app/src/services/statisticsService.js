'use strict';
const logger = require('logger');
const SubscriptionModel = require('models/subscription');
const StadisticModel = require('models/stadistic');
const GenericError = require('errors/genericError');
const ctRegisterMicroservice = require('ct-register-microservice-node');

var JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
var deserializer = function (obj) {
  return function (callback) {
    new JSONAPIDeserializer({
      keyForAttribute: 'camelCase'
    }).deserialize(obj, callback);
  };
};

class StatisticsService {

  static * getUsers(startDate, endDate) {
    try {
      const result = yield ctRegisterMicroservice.requestToMicroservice({
        uri: `/user/obtain/all-users?start=${startDate.toISOString().substring(0, 10)}&end=${endDate.toISOString().substring(0, 10)}`,
        method: 'GET',
        json: true
      });

      return yield deserializer(result);
    } catch (err) {
      logger.error('Error obtaining users:', err);
      throw new GenericError(500, 'Error obtaining data');
    }

  }

  static * getTopSubscriptions(startDate, endDate) {
    logger.debug(`Obtaining getTopSubscriptions with startDate ${startDate} and endDate ${endDate}`);
    const topSubs = {};
    const defaultFilter = {
      createdAt: {
        $gte: startDate,
        $lt: endDate
      }
    };
    topSubs.geostore = yield SubscriptionModel.count(Object.assign({}, defaultFilter, {
      'params.geostore': {
        $ne: null
      }
    }));
    topSubs.country = yield SubscriptionModel.count(Object.assign({}, defaultFilter, {
      'params.iso.country': {
        $ne: null
      },
      'params.iso.region': null
    }));
    topSubs.region = yield SubscriptionModel.count(Object.assign({}, defaultFilter, {
      'params.iso.region': {
        $ne: null
      }
    }));
    topSubs.wdpa = yield SubscriptionModel.count(Object.assign({}, defaultFilter, {
      'params.wdpaid': {
        $ne: null
      }
    }));
    topSubs.use = yield SubscriptionModel.count(Object.assign({}, defaultFilter, {
      'params.use': {
        $ne: null
      }
    }));

    return topSubs;
  }

  static * infoSubscriptions(startDate, endDate) {
    logger.debug(`Obtaining infoSubscriptions with startDate ${startDate} and endDate ${endDate}`);
    const info = {};

    const defaultFilter = {
      createdAt: {
        $gte: startDate,
        $lt: endDate
      }
    };

    info.numSubscriptions = yield SubscriptionModel.count(defaultFilter);
    info.totalSubscriptions = yield SubscriptionModel.count();
    logger.debug(SubscriptionModel.aggregate([{
      $group: {
        _id: '$userId'
      }
    }, {
      $group: {
        _id: 1,
        count: {
          $sum: 1
        }
      }
    }]));
    info.usersWithSubscriptions = yield SubscriptionModel.aggregate([{
      $group: {
        _id: '$userId'
      }
    }, {
      $group: {
        _id: 1,
        count: {
          $sum: 1
        }
      }
    }]).exec();
    if (info.usersWithSubscriptions) {
      info.usersWithSubscriptions = info.usersWithSubscriptions[0].count;
    }
    info.totalEmailsSentInThisQ = yield StadisticModel.count(defaultFilter);
    info.totalEmailsSended = yield StadisticModel.count();

    return info;
  }

  static * getNewUsersWithSubs(startDate, endDate, users) {
    let usersCount = 0;
    if (users)  {
      for (let i = 0, length = users.length; i < length; i++) {
        usersCount += yield SubscriptionModel.count({
          userId: users[i].id
        });
      }
    }
    return usersCount;
  }

  static * getStatistics(startDate, endDate) {
    const users = yield StatisticsService.getUsers(startDate, endDate);
    const topSubs = yield StatisticsService.getTopSubscriptions(startDate, endDate);
    const info = yield StatisticsService.infoSubscriptions(startDate, endDate);
    const usersWithSubscription = yield StatisticsService.getNewUsersWithSubs(startDate, endDate, users);
    return {
      topSubscriptions: topSubs,
      info,
      usersWithSubscription,
      newUsers: users ? users.length : 0
    };
  }

}

module.exports = StatisticsService;
