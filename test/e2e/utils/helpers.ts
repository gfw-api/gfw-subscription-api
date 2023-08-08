import chai from 'chai';
import nock from 'nock';
import config from 'config';
import Statistic from 'models/statistic';
import Subscription from 'models/subscription';
import UrlService from 'services/urlService';
import { USERS } from './test.constants';
import { RedisClientType } from 'redis';
import ChaiHttp from 'chai-http';
import { mockCloudWatchLogRequest, mockValidateRequest } from "rw-api-microservice-node/dist/test-mocks";
import { ApplicationValidationResponse } from "rw-api-microservice-node/dist/types";

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
            geostore: '423e5dfb0448e692f97b590c61f45f22'
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
            geostore: '423e5dfb0448e692f97b590c61f45f22'
        },
        resource: {
            content: 'http://potato-url.com/notify',
            type: 'URL'
        },
        ...data
    };
};

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
            geostore: '423e5dfb0448e692f97b590c61f45f22'
        },
        resource: {
            content: 'subscription-recipient@vizzuality.com',
            type: 'EMAIL'
        },
        ...data
    }).save();
};

export const createStatistic = (createdAt = new Date(), application = 'gfw') => new Statistic({
    slug: 'viirs-active-fires',
    application,
    createdAt,
}).save();

type HTTP_VERBS = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head'

export const createAuthCases = (url: string, initMethod: HTTP_VERBS, providedRequester: ChaiHttp.Agent) => {
    let requester: ChaiHttp.Agent = providedRequester;
    const setRequester = (req: ChaiHttp.Agent) => {
        requester = req;
    };

    const isUserForbidden = (method: HTTP_VERBS = initMethod) => async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.USER });

        const response = await requester[method](url)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send();
        response.status.should.equal(403);
        ensureCorrectError(response.body, 'Not authorized');
    };

    const isManagerForbidden = (method = initMethod) => async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.MANAGER });

        const response = await requester[method](url)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send();
        response.status.should.equal(403);
        ensureCorrectError(response.body, 'Not authorized');
    };

    const isRightAppRequired = (method = initMethod) => async () => {
        mockValidateRequestWithApiKeyAndUserToken({ user: USERS.WRONG_ADMIN });

        const response = await requester[method](url)
            .set('Authorization', `Bearer abcd`)
            .set('x-api-key', 'api-key-test')
            .send();
        response.status.should.equal(403);
        ensureCorrectError(response.body, 'Not authorized');
    };

    const isUserRequired = (method = initMethod) => async () => {
        mockValidateRequestWithApiKey({});
        const response = await requester[method](url)
            .set('x-api-key', 'api-key-test')
            .send();
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

export const validRedisMessage = (data: {
    application?: string,
    template?: string
} = {}) => async (message: string) => {
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

export const assertNoEmailSent = (redisClient: RedisClientType) => {
    redisClient.on('message', () => chai.should().fail('No message should have been sent.'));
};

const APPLICATION: ApplicationValidationResponse = {
    data: {
        type: "applications",
        id: "649c4b204967792f3a4e52c9",
        attributes: {
            name: "grouchy-armpit",
            organization: null,
            user: null,
            apiKeyValue: "a1a9e4c3-bdff-4b6b-b5ff-7a60a0454e13",
            createdAt: "2023-06-28T15:00:48.149Z",
            updatedAt: "2023-06-28T15:00:48.149Z"
        }
    }
};

export const mockValidateRequestWithApiKey = ({
                                                  apiKey = 'api-key-test',
                                                  application = APPLICATION
                                              }) => {
    mockValidateRequest({
        gatewayUrl: process.env.GATEWAY_URL,
        microserviceToken: process.env.MICROSERVICE_TOKEN,
        application,
        apiKey
    });
    mockCloudWatchLogRequest({
        application,
        awsRegion: process.env.AWS_REGION,
        logGroupName: process.env.CLOUDWATCH_LOG_GROUP_NAME,
        logStreamName: config.get('service.name')
    });
};

export const mockValidateRequestWithApiKeyAndUserToken = ({
                                                              apiKey = 'api-key-test',
                                                              token = 'abcd',
                                                              application = APPLICATION,
                                                              user = USERS.USER
                                                          }) => {
    mockValidateRequest({
        gatewayUrl: process.env.GATEWAY_URL,
        microserviceToken: process.env.MICROSERVICE_TOKEN,
        user,
        application,
        token,
        apiKey
    });
    mockCloudWatchLogRequest({
        user,
        application,
        awsRegion: process.env.AWS_REGION,
        logGroupName: process.env.CLOUDWATCH_LOG_GROUP_NAME,
        logStreamName: config.get('service.name')
    });
};
