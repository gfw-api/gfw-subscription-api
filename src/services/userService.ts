import { RWAPIMicroservice } from 'rw-api-microservice-node';
import { User } from 'types/user.type';

class UserService {

    static async getUserById(userId: string): Promise<User> {
        const body: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
            uri: `/auth/user/${userId}`,
            method: 'GET',
        });
        return body.data;
    }

}

export default UserService;
