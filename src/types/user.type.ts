export type User = {
    id: string,
    email: string,
    provider: string,
    role: string,
};

export type GetUserResponse = {
    data: User;
}
