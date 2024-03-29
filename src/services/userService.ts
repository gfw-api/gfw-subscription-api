import { RWAPIMicroservice } from 'rw-api-microservice-node';
import { User } from 'types/user.type';

class UserService {

    static async getUserById(userId: string, apiKey: string): Promise<User> {
        const body: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
            uri: `/auth/user/${userId}`,
            method: 'GET',
            headers: {
                'x-api-key': apiKey
            }
        });
        return body.data;
    }

}

export default UserService;
