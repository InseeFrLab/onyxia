import axios from 'axios';
import getKeycloak from './keycloak-config';
import { setLocalToken } from 'js/utils';
import conf from '../configuration';
const BASE_URL = conf.API.BASE_URL;

const refreshToken = (minValidity = 60) =>
	new Promise((resolve, reject) => {
		getKeycloak()
			.updateToken(minValidity)
			.then((refreshed) => {
				if (refreshed) {
					setLocalToken(getKeycloak().token);
				}
				resolve(getKeycloak().token);
			})
			.catch((error) => {
				reject(error);
			});
	});

const authorizeConfig = (kc) => (config) => ({
	...config,
	headers: { Authorization: `Bearer ${kc.token}` },
	'Content-Type': 'application/json;charset=utf-8',
	Accept: 'application/json;charset=utf-8',
});

const axiosAuth = axios.create({ baseURL: BASE_URL });

if (conf.AUTHENTICATION.TYPE === 'oidc') {
	axiosAuth.interceptors.request.use(
		(config) =>
			refreshToken()
				.then((token) =>
					Promise.resolve(authorizeConfig(getKeycloak())(config))
				)
				.catch(() => getKeycloak().login()),
		(error) => Promise.reject(error)
	);
}

axiosAuth.interceptors.response.use(
	(response) => response.data,
	(error) => Promise.reject(error)
);

const axiosPublicFolder = axios.create({ baseURL: BASE_URL });

const axiosPublic = axios.create({ baseURL: BASE_URL });

axiosPublic.interceptors.response.use(
	(response) => response.data,
	(error) => Promise.reject(error)
);

export { axiosAuth, axiosPublic, axiosPublicFolder, refreshToken };
