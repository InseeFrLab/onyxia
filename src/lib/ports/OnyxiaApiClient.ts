


export type OnyxiaApiClient = {

    getUserInfo(): Promise<{
        ip: string;
        nomComplet: string;
    }>;

};