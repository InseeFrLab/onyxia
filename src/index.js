import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import axios from 'axios';
import App from 'js/components';
import { store } from 'js/redux';
import { getKeycloak } from 'js/utils';
import { setAuthenticated } from 'js/redux/actions';
import { gelLocalToken, setLocalToken } from 'js/utils';
import JavascriptTimeAgo from 'javascript-time-ago';
import fr from 'javascript-time-ago/locale/fr';
import configuration from 'js/configuration';
import { getVaultToken } from 'js/vault-client';
import conf from 'js/configuration';
import generator from 'generate-password';

const VAULT_BASE_URI = conf.VAULT.VAULT_BASE_URI;

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
					setLocalToken(getKeycloak().token);
					store.dispatch(
						setAuthenticated({
							accessToken: getKeycloak().token,
							refreshToken: getKeycloak().refreshToken,
							idToken: getKeycloak().idToken,
						})
					);
					const idep = getKeycloak().tokenParsed['preferred_username'];
					const axiosVault = axios.create({
						baseURL: conf.VAULT.VAULT_BASE_URI,
					});
					const authorizeConfig = (token) => (config) => ({
						...config,
						headers: { 'X-Vault-Token': token },
						'Content-Type': 'application/json;charset=utf-8',
						Accept: 'application/json;charset=utf-8',
					});
					axiosVault.interceptors.request.use((config) =>
						getVaultToken().then((token) =>
							Promise.resolve(authorizeConfig(token)(config))
						)
					);
					axiosVault(
						`${VAULT_BASE_URI}/v1/onyxia-kv/${idep}/.onyxia/profile`
					).catch(() => {
						var password = generator.generate({
							length: 20,
							numbers: true,
						});
						axiosVault.post(`/v1/onyxia-kv/${idep}/.onyxia/profile`, {
							password,
						});
					});
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
