import chai from 'chai';
import ChaiHttp from 'chai-http';
import { Server } from 'http';

let requester: ChaiHttp.Agent;
let createdServer: Server;

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
