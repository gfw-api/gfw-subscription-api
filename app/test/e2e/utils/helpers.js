const chai = require('chai');
const nock = require('nock');

const Statistic = require('models/statistic');
const Subscription = require('models/subscription');
const UrlService = require('services/urlService');
const { ROLES } = require('./test.constants');

const getUUID = () => Math.random().toString(36).substring(7);

const ensureCorrectError = (body, errMessage) => {
    body.should.have.property('errors').and.be.an('array');
    body.errors[0].should.have.property('detail').and.equal(errMessage);
};

const getDateWithIncreaseYear = (years) => new Date(new Date().setFullYear(new Date().getFullYear() + years));
const getDateWithDecreaseYear = (years) => new Date(new Date().setFullYear(new Date().getFullYear() - years));

const createSubscription = (userId, datasetUuid = null, data = {}) => {
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
            content: 'subscription-recipient@vizzuality.com',
            type: 'EMAIL'
        },
        ...data
    };
};

const createSubInDB = (userId, datasetUuid = null, data = {}) => new Subscription(createSubscription(userId, datasetUuid, data)).save();

const createStatistic = (createdAt = new Date(), application = 'gfw') => new Statistic({
    slug: 'viirs-active-fires',
    application,
    createdAt,
}).save();

const createAuthCases = (url, initMethod, providedRequester) => {
    let requester = providedRequester;
    const { USER, MANAGER, WRONG_ADMIN } = ROLES;

    const setRequester = (req) => { requester = req; };

    const isUserForbidden = (method = initMethod) => async () => {
        const response = await requester[method](url).query({ loggedUser: JSON.stringify(USER) }).send();
        response.status.should.equal(403);
        ensureCorrectError(response.body, 'Not authorized');
    };

    const isManagerForbidden = (method = initMethod) => async () => {
        const response = await requester[method](url).query({ loggedUser: JSON.stringify(MANAGER) }).send();
        response.status.should.equal(403);
        ensureCorrectError(response.body, 'Not authorized');
    };

    const isRightAppRequired = (method = initMethod) => async () => {
        const response = await requester[method](url).query({ loggedUser: JSON.stringify(WRONG_ADMIN) }).send();
        response.status.should.equal(403);
        ensureCorrectError(response.body, 'Not authorized');
    };

    const isLoggedUserRequired = (method = initMethod) => async () => {
        const response = await requester[method](url).send();
        response.status.should.equal(401);
        ensureCorrectError(response.body, 'Not authorized');
    };

    const isLoggedUserJSONString = (method = initMethod) => async () => {
        const response = await requester[method](url).query({ loggedUser: USER }).send();
        response.status.should.equal(400);
        ensureCorrectError(response.body, 'Invalid user token');
    };

    const isLoggedUserJSONObject = (method = initMethod) => async () => {
        const response = await requester[method](url).query({ loggedUser: '[]' }).send();
        response.status.should.equal(401);
        ensureCorrectError(response.body, 'Not authorized');
    };

    return {
        setRequester,
        isRightAppRequired,
        isUserForbidden,
        isManagerForbidden,
        isLoggedUserRequired,
        isLoggedUserJSONString,
        isLoggedUserJSONObject,
    };
};

const validRedisMessage = (data = {}) => async (channel, message) => {
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

const createDatasetWithWebHook = async (url, extraMock = false) => {
    await new Subscription(createSubscription(ROLES.USER.id, 'glad-alerts', {
        datasetsQuery: [{ id: 'glad-alerts', type: 'dataset' }],
        resource: { content: url, type: 'URL' },
    })).save();

    if (extraMock) {
        nock(process.env.CT_URL)
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

const assertNoEmailSent = (redisClient) => {
    redisClient.on('message', () => chai.should().fail('No message should have been sent.'));
};

module.exports = {
    createSubscription,
    getUUID,
    createSubInDB,
    ensureCorrectError,
    createStatistic,
    getDateWithIncreaseYear,
    getDateWithDecreaseYear,
    createAuthCases,
    validRedisMessage,
    createDatasetWithWebHook,
    assertNoEmailSent,
};
