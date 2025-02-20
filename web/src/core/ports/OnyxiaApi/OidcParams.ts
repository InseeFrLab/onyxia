export type OidcParams = {
    issuerUri: string;
    clientId: string;
    extraQueryParams_raw: string | undefined;
    scopes_raw: string | undefined;
    __clientSecret: string | undefined;
};

export type OidcParams_Partial = { [P in keyof OidcParams]: OidcParams[P] | undefined };
