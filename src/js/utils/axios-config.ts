import axios from 'axios';
import { getKeycloakInstance } from "./getKeycloakInstance";
import * as localStorageToken from './localStorageToken';
import { env } from 'js/env';
import { store } from 'js/redux/store';
import { assert } from "evt/tools/typeSafety/assert";

const BASE_URL = env.API.BASE_URL;

const refreshToken = (minValidity = 60) => {


	const keycloakInstance = getKeycloakInstance();

	return keycloakInstance
		.updateToken(minValidity)
		.then((refreshed: any) => {
			if (refreshed) {

				assert(keycloakInstance.token !== undefined); //TODO: figure out

				localStorageToken.set(keycloakInstance.token);
			}
			return keycloakInstance.token;
		});

};



const authorizeConfig = (kc: any) => (config: any) => ({
	...config,
	"headers": { ...config.headers, "Authorization": `Bearer ${kc.token}` },
	"Content-Type": 'application/json;charset=utf-8',
	"Accept": 'application/json;charset=utf-8',
});

const axiosAuth = axios.create({ "baseURL": BASE_URL });

walk: {

	if (env.AUTHENTICATION.TYPE !== 'oidc') {
		break walk;
	}

	axiosAuth.interceptors.request.use(
		config =>
			refreshToken()
				.then(() =>
					Promise.resolve(authorizeConfig(getKeycloakInstance())(config))
				)
				.catch(() => getKeycloakInstance().login()),
		error => Promise.reject(error)
	);

}


const injectRegion = (config: any) => {
	const selectedRegion = store?.getState()?.regions?.selectedRegion;
	if (selectedRegion) {
		config = {
			...config,
			headers: { 'ONYXIA-REGION': selectedRegion.id },
		};
	}
	return config;
};

axiosAuth.interceptors.request.use(injectRegion);

axiosAuth.interceptors.response.use(
	(response) => response.data,
	(error) => Promise.reject(error)
);

const axiosPublic = axios.create({ baseURL: BASE_URL });

axiosPublic.interceptors.response.use(
	(response) => response.data,
	(error) => Promise.reject(error)
);

axiosPublic.interceptors.request.use(injectRegion);

const axiosURL = axios.create();

axiosURL.interceptors.response.use(
	(response) => response.data,
	(error) => Promise.reject(error)
);

export { axiosAuth, axiosPublic, axiosURL, refreshToken };
