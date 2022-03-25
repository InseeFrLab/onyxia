export type User = {
    email: string;
    familyName: string;
    firstName: string;
    username: string;
    groups?: string[];
    locale?: string;
};

export type UserApiClient = {
    getUser: () => Promise<User>;
};
