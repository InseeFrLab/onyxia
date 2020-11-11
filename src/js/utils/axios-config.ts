import axios from 'axios';
import { getKeycloakInstance } from "./getKeycloakInstance";
import { locallyStoredOidcAccessToken } from './locallyStoredOidcAccessToken';
import { getEnv } from 'js/env';
import { assert } from "evt/tools/typeSafety/assert";
import memoize from "memoizee";

const BASE_URL = getEnv().API.BASE_URL;

const { injectRegion } = (() => {

	/** We avoid importing app right away to prevent require cycles */
	const getStore = memoize(
		() => import("js/../libs/setup")
			.then(ns => ns.prStore),
		{ "promise": true }
	);


	async function injectRegion(config: any) {

		const store = await getStore();

		const selectedRegion = store.getState().regions.selectedRegion;

		return {
			...config,
			...(
				!selectedRegion ?
					{}
					:
					{
						"headers": {
							...config?.headers,
							"ONYXIA-REGION": selectedRegion.id
						}
					}
			)
		};


	};

	return { injectRegion };


})();




export const { axiosAuth } = (() => {

	const axiosAuth = axios.create({ "baseURL": BASE_URL });

	if (getEnv().AUTHENTICATION.TYPE === "oidc") {

		axiosAuth.interceptors.request.use(
			async config => {

				const keycloakInstance = getKeycloakInstance();

				const refreshed: any = await keycloakInstance.updateToken(60);

				if (refreshed) {

					assert(keycloakInstance.token !== undefined); //TODO: figure out

					locallyStoredOidcAccessToken.set(keycloakInstance.token);

				}
				return {
					...(config as any),
					"headers": { ...config.headers, "Authorization": `Bearer ${keycloakInstance.token}` },
					"Content-Type": 'application/json;charset=utf-8',
					"Accept": 'application/json;charset=utf-8',
				};


			},
			error => { throw error; }
		);

	}

	axiosAuth.interceptors.request.use(injectRegion);

	axiosAuth.interceptors.response.use(
		(response) => response.data,
		(error) => Promise.reject(error)
	);

	return { axiosAuth };

})();


export const { axiosPublic } = (() => {

	const axiosPublic = axios.create({ baseURL: BASE_URL });

	axiosPublic.interceptors.response.use(
		(response) => response.data,
		(error) => Promise.reject(error)
	);

	axiosPublic.interceptors.request.use(injectRegion);

	return { axiosPublic };

})();


export const { axiosURL } = (() => {

	const axiosURL = axios.create();

	axiosURL.interceptors.response.use(
		(response) => response.data,
		(error) => Promise.reject(error)
	);

	return { axiosURL };


})();

