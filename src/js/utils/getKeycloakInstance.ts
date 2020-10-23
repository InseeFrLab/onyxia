import keycloak_js from "keycloak-js";
import { env } from "../env";
import { assert } from "evt/tools/typeSafety/assert";
import memoizee from "memoizee";

export const getKeycloakInstance= memoizee(()=> {

    assert(env.AUTHENTICATION.TYPE === "oidc");

    return keycloak_js(env.AUTHENTICATION.OIDC)

});
