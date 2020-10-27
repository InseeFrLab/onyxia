import keycloak_js from "keycloak-js";
import { getEnv } from "../env";
import { assert } from "evt/tools/typeSafety/assert";
import memoizee from "memoizee";


export const getKeycloakInstance= memoizee(()=> {

    const env = getEnv();

    assert(env.AUTHENTICATION.TYPE === "oidc");

    return keycloak_js(env.AUTHENTICATION.OIDC)

});
