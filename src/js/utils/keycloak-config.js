import keycloak from 'keycloak-js';
import conf from '../configuration';

var kc;
const getKC = () => {
	if (!kc) {
		kc = keycloak(conf.AUTHENTICATION.OIDC);
	}
	return kc;
};
export default getKC;
