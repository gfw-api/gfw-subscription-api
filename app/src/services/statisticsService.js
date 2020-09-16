/* eslint-disable operator-assignment */

const logger = require('logger');
const SubscriptionModel = require('models/subscription');
const StatisticModel = require('models/statistic');
const GenericError = require('errors/genericError');
const SubscriptionService = require('services/subscriptionService');
const SparkpostService = require('services/sparkpostService');
const ctRegisterMicroservice = require('ct-register-microservice-node');

const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;

class StatisticsService {

    static async getUsers(startDate, endDate) {
        logger.info('[StatisticsService] Loading users');
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri: `/user/obtain/all-users?start=${startDate.toISOString().substring(0, 10)}&end=${endDate.toISOString().substring(0, 10)}`,
                method: 'GET',
                json: true
            });

            return await new JSONAPIDeserializer({
                keyForAttribute: 'camelCase'
            }).deserialize(result);
        } catch (err) {
            logger.error('Error obtaining users:', err);
            throw new GenericError(500, 'Error obtaining data');
        }

    }

    static async getTopSubscriptions(startDate, endDate, application) {
        logger.debug(`Obtaining getTopSubscriptions with startDate ${startDate}, endDate ${endDate} and application ${application}`);
        const topSubs = {};
        const defaultFilter = {
            createdAt: { $gte: startDate, $lt: endDate },
            application: { $eq: application },
        };
        topSubs.geostore = await SubscriptionModel.count({
            ...defaultFilter,
            'params.geostore': {
                $ne: null
            }
        });
        topSubs.country = await SubscriptionModel.count({
            ...defaultFilter,
            'params.iso.country': {
                $ne: null
            },
            'params.iso.region': null
        });
        topSubs.region = await SubscriptionModel.count({
            ...defaultFilter,
            'params.iso.region': {
                $ne: null
            }
        });
        topSubs.wdpa = await SubscriptionModel.count({
            ...defaultFilter,
            'params.wdpaid': {
                $ne: null
            }
        });
        topSubs.use = await SubscriptionModel.count({
            ...defaultFilter,
            'params.use': {
                $ne: null
            }
        });

        return topSubs;
    }

    static async getUser(userId) {
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri: `/user/${userId}`,
                method: 'GET',
                json: true
            });

            return await new JSONAPIDeserializer({
                keyForAttribute: 'camelCase'
            }).deserialize(result);
        } catch (err) {
            if (err.statusCode !== 404) {
                logger.error('Error obtaining users:', err);
            }
            return null;
        }

    }

    static async infoByUserSubscriptions(startDate, endDate, application) {
        logger.debug(`Obtaining  subscriptions with startDate ${startDate}, endDate ${endDate} and application ${application}`);
        const filter = {
            createdAt: { $gte: startDate, $lt: endDate },
            application: { $eq: application },
        };

        const subscriptions = await SubscriptionModel.find(filter);
        const usersCache = {};
        const data = [];
        for (let i = 0, { length } = subscriptions; i < length; i++) {
            if (!usersCache[subscriptions[i].userId]) {
                usersCache[subscriptions[i].userId] = await StatisticsService.getUser(subscriptions[i].userId);
            }
            const subs = subscriptions[i].toJSON();
            subs.user = usersCache[subscriptions[i].userId];
            data.push(subs);

        }
        return data;
    }

    static async infoGroupSubscriptions(startDate, endDate, application) {
        logger.debug(`Obtaining group subscriptions with startDate ${startDate}, endDate ${endDate} and application ${application}`);
        const filter = {
            createdAt: { $gte: startDate, $lt: endDate },
            datasets: { $ne: [] },
            application: { $eq: application },
        };

        const subscriptions = await SubscriptionModel.find(filter);
        const data = {};
        logger.debug('Subscriptions', subscriptions.length);
        subscriptions.forEach((sub) => {
            logger.debug('Iterating subs', sub);
            sub.datasets.forEach((dat) => {
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
                        data[dat].regions[sub.params.iso.region] = data[dat].regions[sub.params.iso.region] + 1;
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
                        data[dat].countries[sub.params.iso.country] = data[dat].countries[sub.params.iso.country] + 1;
                        if (data[dat].countries[sub.params.iso.country] > data[dat].countryTop.value) {
                            data[dat].countryTop.name = sub.params.iso.country;
                            data[dat].countryTop.value = data[dat].countries[sub.params.iso.country];
                        }
                    }
                } else if (sub.params.wdpaid) {
                    data[dat].wdpa = data[dat].wdpa + 1;
                    if (!data[dat].wdpas[sub.params.wdpaid]) {
                        data[dat].wdpas[sub.params.wdpaid] = 0;
                    }
                    data[dat].wdpas[sub.params.wdpaid] = data[dat].wdpas[sub.params.wdpaid] + 1;
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

    static async infoSubscriptions(startDate, endDate, application) {
        logger.debug(`Obtaining infoSubscriptions with startDate ${startDate}, endDate ${endDate} and application ${application}`);
        const info = {};

        const defaultFilter = {
            createdAt: { $gte: startDate, $lt: endDate },
            application: { $eq: application },
        };

        info.numSubscriptions = await SubscriptionModel.count(defaultFilter);
        info.totalSubscriptions = await SubscriptionModel.count();
        logger.debug(SubscriptionModel.aggregate([
            { $match: { application: { $eq: application } } },
            { $group: { _id: '$userId' } },
            {
                $group: {
                    _id: 1,
                    count: {
                        $sum: 1
                    }
                }
            }]));
        const usersWithSubscriptionResult = await SubscriptionModel.aggregate([
            { $match: { application: { $eq: application } } },
            { $group: { _id: '$userId' } },
            {
                $group: {
                    _id: 1,
                    count: { $sum: 1 }
                }
            }]).exec();
        info.usersWithSubscriptions = usersWithSubscriptionResult.length > 0
            ? usersWithSubscriptionResult[0].count
            : 0;
        info.totalEmailsSentInThisQ = await StatisticModel.count(defaultFilter);
        info.totalEmailsSended = await StatisticModel.count();

        return info;
    }

    static async getNewUsersWithSubs(users, application) {
        let usersCount = 0;
        if (users) {
            for (let i = 0, { length } = users; i < length; i++) {
                usersCount += await SubscriptionModel.count({
                    userId: users[i].id,
                    application: { $eq: application },
                });
            }
        }
        return usersCount;
    }

    static async getStatistics(startDate, endDate, application = 'gfw') {
        const users = await StatisticsService.getUsers(startDate, endDate);
        const topSubs = await StatisticsService.getTopSubscriptions(startDate, endDate, application);
        const info = await StatisticsService.infoSubscriptions(startDate, endDate, application);
        const groupStatistics = await StatisticsService.infoGroupSubscriptions(startDate, endDate, application);
        const usersWithSubscription = await StatisticsService.getNewUsersWithSubs(users, application);
        return {
            topSubscriptions: topSubs,
            info,
            usersWithSubscription,
            newUsers: users ? users.length : 0,
            groupStatistics
        };
    }

    static async countEmailsSentForSlugOnDate(date, slug) {
        return StatisticModel.countDocuments({
            slug,
            createdAt: {
                $gte: date.clone()
                    .hours(0)
                    .minutes(0)
                    .seconds(0)
                    .toDate(),

                $lt: date.clone()
                    .hours(23)
                    .minutes(59)
                    .seconds(59)
                    .toDate(),
            },
        });
    }

    static async getGLADEmailsValidationObject(date) {
        const gladSubs = await SubscriptionService.findGLADEmailSubscriptions();
        const gladSent = await StatisticsService.countEmailsSentForSlugOnDate(date, 'glad-alerts');
        const gladSparkpostCount = await SparkpostService.getGLADCountInjectedOnDate(date);

        return {
            success: true,
            expectedSubscriptionEmailsSent: gladSubs.length,
            actualSubscriptionEmailsSent: gladSent,
            sparkPostAPICalls: gladSparkpostCount,
        };
    }

    static async getVIIRSEmailsValidationObject(date) {
        const viirsSubs = await SubscriptionService.findVIIRSEmailSubscriptions();
        const viirsSent = await StatisticsService.countEmailsSentForSlugOnDate(date, 'viirs-active-fires');
        const viirsSparkpostCount = await SparkpostService.getVIIRSCountInjectedOnDate(date);

        return {
            success: true,
            expectedSubscriptionEmailsSent: viirsSubs.length,
            actualSubscriptionEmailsSent: viirsSent,
            sparkPostAPICalls: viirsSparkpostCount,
        };
    }

    static async getMonthlyEmailsValidationObject(date) {
        const monthlySubs = await SubscriptionService.findMonthlySummaryEmailSubscriptions();
        const monthlySent = await StatisticsService.countEmailsSentForSlugOnDate(date, 'monthly-summary');
        const monthlySparkpostCount = await SparkpostService.getMonthlyCountInjectedOnDate(date);

        return {
            success: true,
            expectedSubscriptionEmailsSent: monthlySubs.length,
            actualSubscriptionEmailsSent: monthlySent,
            sparkPostAPICalls: monthlySparkpostCount,
        };
    }

}

module.exports = StatisticsService;
