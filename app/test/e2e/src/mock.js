const nock = require('nock');
const config = require('config');
const {
    mockDataset, MOCK_FILE, MOCK_USERS
} = require('./test.constants');

const createMockDataset = id => nock(process.env.CT_URL)
    .get(`/v1/dataset/${id}`)
    .reply(200, {
        data: mockDataset(id)
    });

const createMockQuery = () => nock(process.env.CT_URL)
    .get(/\/v1\/query\?(.)*/)
    .reply(200, {
        data: { url: MOCK_FILE }
    });

const createMockUsersWithRange = (startDate, endDate) => nock(process.env.CT_URL)
    .get(`/v1/user/obtain/all-users?start=${startDate.toISOString().substring(0, 10)}&end=${endDate.toISOString().substring(0, 10)}`)
    .reply(200, { data: MOCK_USERS });

const createMockSendConfirmationSUB = () => nock(config.get('gfw.flagshipUrl'))
    .get('/my_gfw/subscriptions')
    .reply(200, { mockMessage: 'Should redirect' });

const createMockConfirmSUB = () => nock(config.get('gfw.flagshipUrl'))
    .get('/my_gfw/subscriptions?subscription_confirmed=true')
    .reply(200, { mockMessage: 'Should redirect' });

const createMockUnsubscribeSUB = () => nock(config.get('gfw.flagshipUrl'))
    .get('/my_gfw/subscriptions?unsubscription_confirmed=true')
    .reply(200, { mockMessage: 'Should redirect' });

const createMockUsers = (userIDS) => {
    const createMock = user => nock(process.env.CT_URL)
        .get(`/v1/user/${user.id}`)
        .reply(200, { data: user });

    userIDS.map(userID => createMock(MOCK_USERS.find(user => user.id === userID)));
};

module.exports = {
    createMockUnsubscribeSUB,
    createMockSendConfirmationSUB,
    createMockDataset,
    createMockConfirmSUB,
    createMockQuery,
    createMockUsersWithRange,
    createMockUsers
};
