

import type { OidcClient, OidcTokens, ParsedJwt } from "../ports/OidcClient";
import { Evt } from "evt";
import { id } from "tsafe/id";
import * as jwtSimple from "jwt-simple";

export async function createPhonyOidcClient(
    params: {
        tokenValidityDurationMs: number;
        parsedJwt: ParsedJwt;
    }
): Promise<OidcClient.LoggedIn> {

    const {
        generateFakeTokens,
        getDelayBeforeTokensExpiration
    } = createFakeTokenApi(params);

    const evtOidcTokens =
        Evt.create<OidcTokens | undefined>(generateFakeTokens());

    return id<OidcClient.LoggedIn>({
        "isUserLoggedIn": true,
        evtOidcTokens,
        "renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired":
            async params => {

                const { minValidity = 10 } = params ?? {};

                const oidcTokens = evtOidcTokens.state;

                if (oidcTokens === undefined) {
                    return;
                }

                const tokenStatus = getDelayBeforeTokensExpiration({ oidcTokens });

                if (!tokenStatus.isExpired && tokenStatus.expiresInMs * 1000 > minValidity) {
                    return;
                }

                evtOidcTokens.state = undefined;

                await new Promise(resolve => setTimeout(resolve, 1000));

                evtOidcTokens.state = generateFakeTokens();

            },
        "logout": async () => {

            alert("oidcClient logout() called");

            return new Promise<never>(() => { });

        },
        "getOidcTokensRemandingValidity": () => {

            const oidcTokens = evtOidcTokens.state;

            if (oidcTokens === undefined) {
                return 0;
            }

            const wrap = getDelayBeforeTokensExpiration({ oidcTokens });
            return wrap.isExpired ? 0 : Math.floor(wrap.expiresInMs / 1000);
        }
    });




}


function createFakeTokenApi(
    params: Parameters<typeof createPhonyOidcClient>[0]
) {

    const { tokenValidityDurationMs, parsedJwt } = params;

    const creationTimeByOidcToken = new WeakMap<OidcTokens, number>();

    const getCount = (() => {

        let count = 0;

        return () => count++;

    })();

    function generateFakeTokens(): OidcTokens {

        const count = getCount();

        const oidcTokens: OidcTokens = {
            "accessToken": jwtSimple.encode(
                parsedJwt,
                "xxx"
            ),
            "idToken": `fake id token n°${count}`,
            "refreshToken": `fake refresh token n°${count}`
        };

        creationTimeByOidcToken.set(oidcTokens, Date.now());

        return oidcTokens;

    }

    function getDelayBeforeTokensExpiration(
        params: {
            oidcTokens: OidcTokens;
        }
    ): ({ isExpired: true; } | { isExpired: false; expiresInMs: number; }) {

        const { oidcTokens } = params;

        const creationTime = creationTimeByOidcToken.get(oidcTokens)!;

        const elapsed = Date.now() - creationTime;

        return elapsed > tokenValidityDurationMs ?
            { "isExpired": true } :
            { "isExpired": false, "expiresInMs": tokenValidityDurationMs - elapsed };


    }

    return {
        generateFakeTokens,
        getDelayBeforeTokensExpiration
    };

}

