export type CreateDecodeJwt = <ClaimName extends string>(params: {
    jwtClaims: Record<ClaimName, string>;
}) => {
    decodeJwt: (params: { jwtToken: string }) => Promise<Record<ClaimName, string>>;
};
