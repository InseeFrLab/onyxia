import keycloak_js from "keycloak-js";
import conf from "../configuration";

let keycloakInstance: keycloak_js.KeycloakInstance | undefined = undefined;

export const getKeycloakInstance = () => {

	if (keycloakInstance === undefined) {
		keycloakInstance = keycloak_js(conf.AUTHENTICATION.OIDC);
	}
	return keycloakInstance;

};
