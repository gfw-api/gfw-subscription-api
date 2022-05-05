import chai from 'chai';
import nock from 'nock';

import Statistic from 'models/statistic';
import Subscription, { ISubscription } from 'models/subscription';
import UrlService from 'services/urlService';
import { ROLES } from './test.constants';
import { RedisClientType } from 'redis';
import ChaiHttp from 'chai-http';

export const getUUID = () => Math.random().toString(36).substring(7);

export const ensureCorrectError = (body: Record<string, any>, errMessage: string) => {
    body.should.have.property('errors').and.be.an('array');
    body.errors[0].should.have.property('detail').and.equal(errMessage);
};

export const getDateWithDecreaseYear = (years: number) => new Date(new Date().setFullYear(new Date().getFullYear() - years));
export const getDateWithIncreaseYear = (years: number) => new Date(new Date().setFullYear(new Date().getFullYear() + years));

/**
 * @deprecated
 *
 * @param userId
 * @param datasetUuid
 * @param data
 */
export const createSubscriptionContent = (userId: string, datasetUuid: string = null, data = {}) => {
    const uuid = getUUID();

    return {
        name: `Subscription ${uuid}`,
        datasets: [datasetUuid || getUUID()],
        userId,
        application: 'gfw',
        confirmed: true,
        params: {
            geostore: 'agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw'
        },
        resource: {
            content: 'subscription-recipient@vizzuality.com',
            type: 'EMAIL'
        },
        ...data
    };
};

export const createURLSubscription = (userId: string, datasetUuid: string = null, data: Record<string, any> = {}) => {
    const uuid = getUUID();

    return {
        name: `Subscription ${uuid}`,
        datasets: [datasetUuid || getUUID()],
        userId,
        application: 'gfw',
        env: 'production',
        confirmed: true,
        params: {
            geostore: 'agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw'
        },
        resource: {
            content: 'http://potato-url.com/notify',
            type: 'URL'
        },
        ...data
    };
};

// const createURLSubscriptionCallMock = (expectedBody) => {
//     nock('http://potato-url.com')
//         .post('/notify', (body) => {
//             const foo = JSON.parse(atob((new URL(body.alert_link)).searchParams.get('map')));
//
//             body.should.deep.equal(expectedBody);
//             return true;
//         })
//         .reply(200);
// };

export const createURLSubscriptionCallMock = (expectedBody: Record<string, any>) => {
    nock('http://potato-url.com')
        .post('/notify', expectedBody)
        .reply(200);
};

export const createSubscription = async (userId: string, data: Record<string, any> = {}) => {
    const uuid = getUUID();

    return new Subscription({
        name: `Subscription ${uuid}`,
        datasets: [getUUID()],
        userId,
        application: 'gfw',
        confirmed: true,
        params: {
            geostore: 'agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw'
        },
        resource: {
            content: 'subscription-recipient@vizzuality.com',
            type: 'EMAIL'
        },
        ...data
    }).save();
};

export const createSubInDB: (userId: string, datasetUuid?: string, data?: any) => Promise<ISubscription> = (userId: string, datasetUuid: string = null, data: any = {}) => new Subscription(createSubscription(userId, data)).save();

export const createStatistic = (createdAt = new Date(), application = 'gfw') => new Statistic({
    slug: 'viirs-active-fires',
    application,
    createdAt,
}).save();

export const mockGetUserFromToken = (userProfile: Record<string, any>) => {
    nock(process.env.GATEWAY_URL, { reqheaders: { authorization: 'Bearer abcd' } })
        .get('/auth/user/me')
        .reply(200, userProfile);
};

type HTTP_VERBS = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head'

export const createAuthCases = (url: string, initMethod: HTTP_VERBS, providedRequester: ChaiHttp.Agent) => {
    let requester: ChaiHttp.Agent = providedRequester;
    const setRequester = (req: ChaiHttp.Agent) => {
        requester = req;
    };

    const isUserForbidden = (method: HTTP_VERBS = initMethod) => async () => {
        mockGetUserFromToken(ROLES.USER);

        const response = await requester[method](url)
            .set('Authorization', `Bearer abcd`)
            .send();
        response.status.should.equal(403);
        ensureCorrectError(response.body, 'Not authorized');
    };

    const isManagerForbidden = (method = initMethod) => async () => {
        mockGetUserFromToken(ROLES.MANAGER);

        const response = await requester[method](url)
            .set('Authorization', `Bearer abcd`)
            .send();
        response.status.should.equal(403);
        ensureCorrectError(response.body, 'Not authorized');
    };

    const isRightAppRequired = (method = initMethod) => async () => {
        mockGetUserFromToken(ROLES.WRONG_ADMIN);

        const response = await requester[method](url)
            .set('Authorization', `Bearer abcd`)
            .send();
        response.status.should.equal(403);
        ensureCorrectError(response.body, 'Not authorized');
    };

    const isUserRequired = (method = initMethod) => async () => {
        const response = await requester[method](url).send();
        response.status.should.equal(401);
        ensureCorrectError(response.body, 'Unauthorized');
    };

    return {
        setRequester,
        isRightAppRequired,
        isUserForbidden,
        isManagerForbidden,
        isUserRequired,
    };
};

export const validRedisMessage = (data: { application?: string, template?: string } = {}) => async (message: string) => {
    const { application, template } = data;

    const subscription = await Subscription.findOne({});

    const messageData = JSON.parse(message);

    messageData.should.instanceOf(Object);
    messageData.template.should.equal(template);
    messageData.should.have.property('data');
    messageData.data.confirmation_url.should.equal(UrlService.confirmationUrl(subscription));
    messageData.recipients.should.instanceOf(Array).and.have.length(1);
    messageData.recipients[0].address = subscription.resource.content;
    messageData.sender.should.equal(application);
};

export const createDatasetWithWebHook = async (url: string, extraMock: boolean = false) => {
    await new Subscription(createSubscriptionContent(ROLES.USER.id, 'glad-alerts', {
        datasetsQuery: [{ id: 'glad-alerts', type: 'dataset' }],
        resource: { content: url, type: 'URL' },
    })).save();

    if (extraMock) {
        nock(process.env.GATEWAY_URL)
            .get('/v1/glad-alerts/')
            .query(() => true)
            .reply(200, {
                data: {
                    attributes: {
                        areaHa: 22435351.3660182,
                        downloadUrls: {
                            // eslint-disable-next-line max-len
                            csv: '/glad-alerts/download/?period=2020-02-22,2020-03-04&gladConfirmOnly=False&aggregate_values=False&aggregate_by=False&geostore=423e5dfb0448e692f97b590c61f45f22&format=csv',
                            // eslint-disable-next-line max-len
                            json: '/glad-alerts/download/?period=2020-02-22,2020-03-04&gladConfirmOnly=False&aggregate_values=False&aggregate_by=False&geostore=423e5dfb0448e692f97b590c61f45f22&format=json'
                        },
                        value: 5
                    },
                    gladConfirmOnly: false,
                    id: '20892bc2-5601-424d-8a4a-605c319418a2',
                    period: '2020-02-22,2020-03-04',
                    type: 'glad-alerts'
                }
            });
    }
};

export const assertNoEmailSent = (redisClient: RedisClientType) => {
    redisClient.on('message', () => chai.should().fail('No message should have been sent.'));
};
