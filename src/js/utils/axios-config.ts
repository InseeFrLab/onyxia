import axios from 'axios';
import { getKeycloakInstance } from "./getKeycloakInstance";
import { locallyStoredOidcAccessToken } from './locallyStoredOidcAccessToken';
import { env } from 'js/env';
import { assert } from "evt/tools/typeSafety/assert";
import memoize from "memoizee";

/** We avoid importing app right away to prevent require cycles */
export const getStore = memoize(
	() => import("js/redux/store"),
	{ "promise": true }
);


const BASE_URL = env.API.BASE_URL;

export const refreshToken = async (minValidity = 60) => {

	const keycloakInstance = getKeycloakInstance();

	const refreshed: any = await keycloakInstance.updateToken(minValidity);

	if (refreshed) {

		assert(keycloakInstance.token !== undefined); //TODO: figure out

		locallyStoredOidcAccessToken.set(keycloakInstance.token);

	}

	return keycloakInstance.token;

};



const authorizeConfig = (kc: any) => (config: any) => ({
	...config,
	"headers": { ...config.headers, "Authorization": `Bearer ${kc.token}` },
	"Content-Type": 'application/json;charset=utf-8',
	"Accept": 'application/json;charset=utf-8',
});

export const axiosAuth = axios.create({ "baseURL": BASE_URL });

// eslint-disable-next-line
walk: {

	if (env.AUTHENTICATION.TYPE !== 'oidc') {
		// eslint-disable-next-line
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

const injectRegion = async (config: any) => {

	const { store } = await getStore();

	const selectedRegion = store.getState().regions.selectedRegion;
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

export const axiosPublic = axios.create({ baseURL: BASE_URL });

axiosPublic.interceptors.response.use(
	(response) => response.data,
	(error) => Promise.reject(error)
);

axiosPublic.interceptors.request.use(injectRegion);

export const axiosURL = axios.create();

axiosURL.interceptors.response.use(
	(response) => response.data,
	(error) => Promise.reject(error)
);
