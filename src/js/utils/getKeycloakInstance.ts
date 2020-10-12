import keycloak_js from "keycloak-js";
import { env } from "../env";
import memoizee from "memoizee";

export const getKeycloakInstance= memoizee(()=> keycloak_js(env.AUTHENTICATION.OIDC));
