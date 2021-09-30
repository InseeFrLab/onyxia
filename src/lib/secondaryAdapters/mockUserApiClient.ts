import type { UserApiClient, User } from "../ports/UserApiClient";

export function createMockJwtUserApiClient(params: { user: User }): UserApiClient {
    const { user } = params;

    return {
        "getUser": () => Promise.resolve(user),
    };
}
