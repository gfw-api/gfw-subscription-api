const nock = require('nock');
const chai = require('chai');
const chaiHttp = require('chai-http');

let requester;
let createdServer;

chai.use(chaiHttp);

const getTestServer = async function getTestServer() {
    if (requester) {
        return requester;
    }

    if (createdServer) {
        createdServer.close();
        createdServer = null;
    }

    if (process.env.CT_REGISTER_MODE && process.env.CT_REGISTER_MODE === 'auto') {
        nock(process.env.CT_URL)
            .post(`/api/v1/microservice`)
            .reply(200);
    }

    const serverPromise = require('../../../src/app');
    const { server } = await serverPromise();
    createdServer = server;
    requester = chai.request(server).keepOpen();

    return requester;
};

const createRequest = async (prefix, method) => {
    if (!createdServer && !requester) {
        if (process.env.CT_REGISTER_MODE && process.env.CT_REGISTER_MODE === 'auto') {
            nock(process.env.CT_URL)
                .post(`/api/v1/microservice`)
                .reply(200);
        }
        const serverPromise = require('../../../src/app');
        const { server } = await serverPromise();
        createdServer = server;
    }
    const newRequest = chai.request(createdServer).keepOpen();
    const oldHandler = newRequest[method];

    newRequest[method] = (url) => oldHandler(prefix + url);

    return newRequest;
};

module.exports = {
    getTestServer,
    createRequest,
};
