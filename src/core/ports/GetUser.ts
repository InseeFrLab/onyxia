export type User = {
    email: string;
    familyName?: string;
    firstName?: string;
    username: string;
    groups?: string[];
};

export type GetUser = () => Promise<User>;
