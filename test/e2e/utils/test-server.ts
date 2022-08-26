import chai from 'chai';
import ChaiHttp from 'chai-http';

let requester: ChaiHttp.Agent;

chai.use(ChaiHttp);

export const getTestServer: () => Promise<ChaiHttp.Agent> = async () => {
    if (requester) {
        return requester;
    }

    const { init } = await import('app');
    const { server } = await init();

    requester = chai.request.agent(server);

    return requester;
};
