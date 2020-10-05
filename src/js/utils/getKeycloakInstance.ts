import keycloak_js from "keycloak-js";
import { env } from "../env";

let keycloakInstance: keycloak_js.KeycloakInstance | undefined = undefined;

export const getKeycloakInstance = () => {

	if (keycloakInstance === undefined) {
		keycloakInstance = keycloak_js(env.AUTHENTICATION.OIDC);
	}
	return keycloakInstance;

};
