import logger from 'logger';
import { RWAPIMicroservice } from 'rw-api-microservice-node';
import SubscriptionModel, { ISubscription } from 'models/subscription';
import StatisticModel from 'models/statistic';
import GenericError from 'errors/genericError';
import { Deserializer } from 'jsonapi-serializer';
import { FilterQuery } from 'mongoose';

type SubscriptionsStatistics = {
    topSubscriptions: TopSubscriptions
    info: SubscriptionInfo
    usersWithSubscription: number
    newUsers: number
    groupStatistics: GroupStatistics
}
type GFWUser = {
    id: string
    firstName: string
    lastName: string
    email: string
    createdAt: string,
    sector: string
    primaryResponsibilities: string[],
    subsector: string
    company: string
    country: string
    state: string
    city: string
    interests: string[]
    howDoYouUse: string[]
    signUpForTesting: boolean
    signUpToNewsletter: boolean,
    topics: string[],
    profileComplete: boolean
}

type TopSubscriptions = {
    geostore: number,
    country: number,
    region: number,
    wdpa: number,
    use: number
}

type SubscriptionInfo = {
    numSubscriptions: number
    totalSubscriptions: number
    usersWithSubscriptions: number
    totalEmailsSentInThisQ: number
    totalEmailsSended: number
}

type GroupStatistics = Record<string, {
    country: number
    region: number
    use: number
    wdpa: number
    geostore: number
    countries: Record<string, number>
    regions: Record<string, number>
    wdpas: Record<string, number>
    countryTop: {
        name: string
        value: number
    },
    regionTop: {
        nameRegion: string
        nameCountry: string
        value: number
    },
    wdpaTop: {
        id: string
        value: number
    }
}>

class StatisticsService {

    // @todo confirm type
    static async #getUsers(startDate: Date, endDate: Date): Promise<GFWUser[]> {
        logger.info('[StatisticsService] Loading users');
        try {
            const result: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
                uri: `/v1/user/obtain/all-users?start=${startDate.toISOString().substring(0, 10)}&end=${endDate.toISOString().substring(0, 10)}`,
                method: 'GET',
                json: true
            });

            return await new Deserializer({
                keyForAttribute: 'camelCase'
            }).deserialize(result);
        } catch (err) {
            logger.error('Error obtaining users:', err);
            throw new GenericError(500, 'Error obtaining data');
        }
    }

    static async #getTopSubscriptions(startDate: Date, endDate: Date, application: string): Promise<TopSubscriptions> {
        logger.debug(`Obtaining getTopSubscriptions with startDate ${startDate}, endDate ${endDate} and application ${application}`);
        const topSubs: Partial<TopSubscriptions> = {};
        const defaultFilter: FilterQuery<ISubscription> = {
            createdAt: { $gte: startDate, $lt: endDate },
            application: { $eq: application },
        };
        topSubs.geostore = await SubscriptionModel.countDocuments({
            ...defaultFilter,
            'params.geostore': {
                $ne: null
            }
        });
        topSubs.country = await SubscriptionModel.countDocuments({
            ...defaultFilter,
            'params.iso.country': {
                $ne: null
            },
            'params.iso.region': null
        });
        topSubs.region = await SubscriptionModel.countDocuments({
            ...defaultFilter,
            'params.iso.region': {
                $ne: null
            }
        });
        topSubs.wdpa = await SubscriptionModel.countDocuments({
            ...defaultFilter,
            'params.wdpaid': {
                $ne: null
            }
        });
        topSubs.use = await SubscriptionModel.countDocuments({
            ...defaultFilter,
            'params.use': {
                $ne: null
            }
        });

        return topSubs as TopSubscriptions;
    }

    static async getUser(userId: string): Promise<GFWUser> {
        try {
            const result: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
                uri: `/v1/user/${userId}`,
                method: 'GET',
                json: true
            });

            return await new Deserializer({
                keyForAttribute: 'camelCase'
            }).deserialize(result);
        } catch (err) {
            if (err.statusCode !== 404) {
                logger.error('Error obtaining users:', err);
            }
            return null;
        }

    }

    static async infoByUserSubscriptions(startDate: Date, endDate: Date, application: string): Promise<Record<string, any>[]> {
        logger.debug(`Obtaining  subscriptions with startDate ${startDate}, endDate ${endDate} and application ${application}`);
        const filter: Partial<Record<keyof ISubscription, any>> = {
            createdAt: { $gte: startDate, $lt: endDate },
            application: { $eq: application },
        };

        const subscriptions: ISubscription[] = await SubscriptionModel.find(filter);
        const usersCache: Record<string, any> = {};
        const data: Record<string, any>[] = [];
        for (let i: number = 0, { length } = subscriptions; i < length; i++) {
            if (!usersCache[subscriptions[i].userId]) {
                usersCache[subscriptions[i].userId] = await StatisticsService.getUser(subscriptions[i].userId);
            }
            const subs: Record<string, any> = subscriptions[i].toJSON();
            subs.user = usersCache[subscriptions[i].userId];
            data.push(subs);

        }
        return data;
    }

    static async infoGroupSubscriptions(startDate: Date, endDate: Date, application: string): Promise<GroupStatistics> {
        logger.debug(`Obtaining group subscriptions with startDate ${startDate}, endDate ${endDate} and application ${application}`);
        const filter: Partial<Record<keyof ISubscription, any>> = {
            createdAt: { $gte: startDate, $lt: endDate },
            datasets: { $ne: [] },
            application: { $eq: application },
        };

        const subscriptions: ISubscription[] = await SubscriptionModel.find(filter);
        const data: Partial<GroupStatistics> = {};
        logger.debug('Subscriptions', subscriptions.length);
        subscriptions.forEach((sub: ISubscription) => {
            logger.debug('Iterating subs', sub);
            sub.datasets.forEach((datasetName: string) => {
                logger.debug('Iterating dataset', data);
                if (!data[datasetName]) {
                    data[datasetName] = {
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
                    data[datasetName].geostore = data[datasetName].geostore + 1;
                } else if (sub.params.iso && (sub.params.iso.country || sub.params.iso.region)) {
                    if (sub.params.iso.region) {
                        data[datasetName].region = data[datasetName].region + 1;
                        if (!data[datasetName].regions[sub.params.iso.region]) {
                            data[datasetName].regions[sub.params.iso.region] = 0;
                        }
                        data[datasetName].regions[sub.params.iso.region] = data[datasetName].regions[sub.params.iso.region] + 1;
                        if (data[datasetName].regions[sub.params.iso.region] > data[datasetName].regionTop.value) {
                            data[datasetName].regionTop.nameRegion = sub.params.iso.region;
                            data[datasetName].regionTop.nameCountry = sub.params.iso.country;
                            data[datasetName].regionTop.value = data[datasetName].regions[sub.params.iso.region];
                        }
                    } else {
                        data[datasetName].country = data[datasetName].country + 1;
                        if (!data[datasetName].countries[sub.params.iso.country]) {
                            data[datasetName].countries[sub.params.iso.country] = 0;
                        }
                        data[datasetName].countries[sub.params.iso.country] = data[datasetName].countries[sub.params.iso.country] + 1;
                        if (data[datasetName].countries[sub.params.iso.country] > data[datasetName].countryTop.value) {
                            data[datasetName].countryTop.name = sub.params.iso.country;
                            data[datasetName].countryTop.value = data[datasetName].countries[sub.params.iso.country];
                        }
                    }
                } else if (sub.params.wdpaid) {
                    data[datasetName].wdpa = data[datasetName].wdpa + 1;
                    if (!data[datasetName].wdpas[sub.params.wdpaid]) {
                        data[datasetName].wdpas[sub.params.wdpaid] = 0;
                    }
                    data[datasetName].wdpas[sub.params.wdpaid] = data[datasetName].wdpas[sub.params.wdpaid] + 1;
                    if (data[datasetName].wdpas[sub.params.wdpaid] > data[datasetName].wdpaTop.value) {
                        data[datasetName].wdpaTop.id = sub.params.wdpaid;
                        data[datasetName].wdpaTop.value = data[datasetName].wdpas[sub.params.wdpaid];
                    }
                } else {
                    data[datasetName].use = data[datasetName].use + 1;
                }
            });

        });

        return data;
    }

    static async #infoSubscriptions(startDate: Date, endDate: Date, application: string): Promise<SubscriptionInfo> {
        logger.debug(`Obtaining infoSubscriptions with startDate ${startDate}, endDate ${endDate} and application ${application}`);
        const info: Partial<SubscriptionInfo> = {};

        const defaultFilter: FilterQuery<ISubscription> = {
            createdAt: { $gte: startDate, $lt: endDate },
            application: { $eq: application },
        };
        info.numSubscriptions = await SubscriptionModel.countDocuments(defaultFilter);
        info.totalSubscriptions = await SubscriptionModel.countDocuments();
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

        // @todo: validate type
        const usersWithSubscriptionResult: { _id: string, count: number }[] = await SubscriptionModel.aggregate([
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
        info.totalEmailsSentInThisQ = await StatisticModel.countDocuments(defaultFilter);
        info.totalEmailsSended = await StatisticModel.countDocuments();

        return info as SubscriptionInfo;
    }

    static async #getNewUsersWithSubs(users: GFWUser[], application: string): Promise<number> {
        let usersCount: number = 0;
        if (users) {
            for (let i: number = 0, { length } = users; i < length; i++) {
                usersCount += await SubscriptionModel.countDocuments({
                    userId: users[i].id,
                    application: { $eq: application },
                });
            }
        }
        return usersCount;
    }

    static async getStatistics(startDate: Date, endDate: Date, application: string = 'gfw'): Promise<SubscriptionsStatistics> {
        const users: GFWUser[] = await StatisticsService.#getUsers(startDate, endDate);
        const topSubs: TopSubscriptions = await StatisticsService.#getTopSubscriptions(startDate, endDate, application);
        const info: SubscriptionInfo = await StatisticsService.#infoSubscriptions(startDate, endDate, application);
        const groupStatistics: GroupStatistics = await StatisticsService.infoGroupSubscriptions(startDate, endDate, application);
        const usersWithSubscription: number = await StatisticsService.#getNewUsersWithSubs(users, application);
        return {
            topSubscriptions: topSubs,
            info,
            usersWithSubscription,
            newUsers: users ? users.length : 0,
            groupStatistics
        };
    }

}

export default StatisticsService;
