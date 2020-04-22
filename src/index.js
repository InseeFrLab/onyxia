import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import App from 'js/components';
import { store } from 'js/redux';
import { getKeycloak } from 'js/utils';
import { setAuthenticated } from 'js/redux/actions';
import { gelLocalToken, setLocalToken } from 'js/utils';
import JavascriptTimeAgo from 'javascript-time-ago';
import fr from 'javascript-time-ago/locale/fr';
import configuration from 'js/configuration';
import { initVaultData } from 'js/vault-client';

JavascriptTimeAgo.locale(fr);

const localToken = gelLocalToken();
const keycloakDefaultConf = {
	onLoad: 'check-sso',
	silentCheckSsoRedirectUri: `${window.location.origin}/silent-sso.html`,
	responseMode: 'query',
	checkLoginIframe: false,
};

const initialiseKeycloak = () =>
	new Promise((resolve) => {
		getKeycloak()
			.init(
				localToken
					? { ...keycloakDefaultConf, token: localToken }
					: keycloakDefaultConf
			)
			.then((authenticated) => {
				if (authenticated) {
					const kc = getKeycloak();
					setLocalToken(kc.token);
					store.dispatch(
						setAuthenticated({
							accessToken: kc.token,
							refreshToken: kc.refreshToken,
							idToken: kc.idToken,
						})
					);
					const idep = kc.tokenParsed['preferred_username'];
					const name = kc.tokenParsed['name'];
					const mail = kc.tokenParsed['email'];
					initVaultData(idep, name, mail);
				}
				resolve(authenticated);
			})
			.catch((err) => {
				console.log(err);
			});

		return false;
	});

if (configuration.AUTHENTICATION.TYPE === 'oidc') {
	initialiseKeycloak().then(() => {
		render(
			<Provider store={store}>
				<App />
			</Provider>,
			document.getElementById('root')
		);
	});
} else {
	setLocalToken('FAKE_TOKEN');
	store.dispatch(
		setAuthenticated({
			accessToken: getKeycloak().token,
			refreshToken: getKeycloak().refreshToken,
			idToken: getKeycloak().idToken,
		})
	);
	render(
		<Provider store={store}>
			<App />
		</Provider>,
		document.getElementById('root')
	);
}
