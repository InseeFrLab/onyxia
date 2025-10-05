export type OidcParams = {
    issuerUri: string;
    clientId: string;
    extraQueryParams_raw: string | undefined;
    scope_spaceSeparated: string | undefined;
    idleSessionLifetimeInSeconds: number | undefined;
};

export type OidcParams_Partial = { [P in keyof OidcParams]: OidcParams[P] | undefined };
