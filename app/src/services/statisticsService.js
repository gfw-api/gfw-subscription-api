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

  static * getUser(userId) {
    try {
      const result = yield ctRegisterMicroservice.requestToMicroservice({
        uri: `/user/${userId}`,
        method: 'GET',
        json: true
      });

      return yield deserializer(result);
    } catch (err) {
      logger.error('Error obtaining users:', err);
      return null;
    }

  }

  static * infoByUserSubscriptions(startDate, endDate, application) {
    logger.debug(`Obtaining  subscriptions with startDate ${startDate} and endDate ${endDate} and application ${application}`);
    const info = {};

    const filter = {
      createdAt: {
        $gte: startDate,
        $lt: endDate
      },
      application
    };

    const subscriptions = yield SubscriptionModel.find(filter);
    const usersCache = {};
    for (let i = 0, length = subscriptions.length; i < length; i++) {
      if (!usersCache[subscriptions[i].userId]) {
        usersCache[subscriptions[i].userId] = yield StatisticsService.getUser(subscriptions[i].userId);
      }
      subscriptions[i].userId = usersCache[subscriptions[i].userId];
    }
    logger.info('usersCache', usersCache);
    return subscriptions;
  }

  static * infoGroupSubscriptions(startDate, endDate, application) {
    logger.debug(`Obtaining group subscriptions with startDate ${startDate} and endDate ${endDate} and application ${application}`);
    const info = {};

    const filter = {
      createdAt: {
        $gte: startDate,
        $lt: endDate
      },
      datasets: {
        $ne: []
      },
      application
    };

    const subscriptions = yield SubscriptionModel.find(filter);
    const data = {};
    logger.debug('Subscriptions', subscriptions.length);
    subscriptions.forEach(sub => {
      logger.debug('Iterating subs', sub);
      sub.datasets.forEach(dat => {
        logger.debug('Iterating dataset', data);
        if (!data[dat]) {
          data[dat] = {
            country: 0,
            region: 0,
            use: 0,
            wdpa: 0,
            geostore: 0,
            countries: {},
            regions: {},
            wdpas: {},
            countryTop: {
              name: null,
              value: 0 
            },
            regionTop: {
              nameRegion: null,
              nameCountry: null,
              value: 0 
            },
            wdpaTop: {
              id: null,
              value: 0 
            }
          };
        }
        if (sub.params.geostore) {
          data[dat].geostore = data[dat].geostore + 1;
        } else if (sub.params.iso && (sub.params.iso.country || sub.params.iso.region)) {
          if (sub.params.iso.region) {
            data[dat].region = data[dat].region + 1;
            if (!data[dat].regions[sub.params.iso.region]) {
              data[dat].regions[sub.params.iso.region] = 0;
            }
            data[dat].regions[sub.params.iso.region] = data[dat].regions[sub.params.iso.region] +1;
            if (data[dat].regions[sub.params.iso.region] > data[dat].regionTop.value) {
              data[dat].regionTop.nameRegion = sub.params.iso.region;
              data[dat].regionTop.nameCountry = sub.params.iso.country;
              data[dat].regionTop.value = data[dat].regions[sub.params.iso.region];
            }
          } else {
            data[dat].country = data[dat].country + 1;
            if (!data[dat].countries[sub.params.iso.country]) {
              data[dat].countries[sub.params.iso.country] = 0;
            }
            data[dat].countries[sub.params.iso.country] = data[dat].countries[sub.params.iso.country] +1;
            if (data[dat].countries[sub.params.iso.country] > data[dat].countryTop.value) {
              data[dat].countryTop.name = sub.params.iso.country;
              data[dat].countryTop.value = data[dat].countries[sub.params.iso.country];
            }
          }
        } else if(sub.params.wdpaid) {
          data[dat].wdpa = data[dat].wdpa + 1;
          if (!data[dat].wdpas[sub.params.wdpaid]) {
            data[dat].wdpas[sub.params.wdpaid] = 0;
          }
          data[dat].wdpas[sub.params.wdpaid] = data[dat].wdpas[sub.params.wdpaid] +1;
          if (data[dat].wdpas[sub.params.wdpaid] > data[dat].wdpaTop.value) {
            data[dat].wdpaTop.id = sub.params.wdpaid;
            data[dat].wdpaTop.value = data[dat].wdpas[sub.params.wdpaid];
          }
        } else {
          data[dat].use = data[dat].use + 1;
        }
      });

    });

    return data;
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

  static * getStatistics(startDate, endDate, application='gfw') {
    const users = yield StatisticsService.getUsers(startDate, endDate);
    const topSubs = yield StatisticsService.getTopSubscriptions(startDate, endDate);
    const info = yield StatisticsService.infoSubscriptions(startDate, endDate);
    const groupStatistics = yield StatisticsService.infoGroupSubscriptions(startDate, endDate, application);
    const usersWithSubscription = yield StatisticsService.getNewUsersWithSubs(startDate, endDate, users);
    return {
      topSubscriptions: topSubs,
      info,
      usersWithSubscription,
      newUsers: users ? users.length : 0,
      groupStatistics
    };
  }

}

module.exports = StatisticsService;
