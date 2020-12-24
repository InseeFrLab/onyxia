

import type { OidcClient, OidcTokens } from "../ports/OidcClient";
import { Evt } from "evt";
import { id } from "evt/tools/typeSafety/id";

export async function createInMemoryOidcClient(
    params: {
        tokenValidityDurationMs: number;
    }
): Promise<OidcClient.LoggedIn> {

    const { tokenValidityDurationMs } = params;

    const { 
        generateFakeTokens, 
        getDelayBeforeTokensExpiration 
    } = createFakeTokenApi({ tokenValidityDurationMs });

    const evtOidcTokens =
        Evt.create<OidcTokens | undefined>(generateFakeTokens());

    return id<OidcClient.LoggedIn>({
        "isUserLoggedIn": true,
        evtOidcTokens,
        "renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired":
            async params => {

                const { minValidity = 10 } = params ?? {};

                const oidcTokens= evtOidcTokens.state;

                if( oidcTokens === undefined ){
                    return;
                }

                const tokenStatus = getDelayBeforeTokensExpiration({ oidcTokens });

                if( !tokenStatus.isExpired && tokenStatus.expiresInMs * 1000 > minValidity ){
                    return;
                }

                evtOidcTokens.state = undefined;

                await new Promise(resolve => setTimeout(resolve, 1000));

                evtOidcTokens.state = generateFakeTokens();

            },
        "logout": async () => {

            alert("oidcClient logout() called");

            return new Promise<never>(() => { });

        }
    });




}


function createFakeTokenApi(
    params: {
        tokenValidityDurationMs: number;
    }
) {

    const { tokenValidityDurationMs } = params;

    const creationTimeByOidcToken = new WeakMap<OidcTokens, number>();

    const getCount = (() => {

        let count = 0;

        return () => count++;

    })();

    function generateFakeTokens(): OidcTokens {

        const count = getCount();

        const oidcTokens: OidcTokens = {
            "accessToken": `fake access token n°${count}`,
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

