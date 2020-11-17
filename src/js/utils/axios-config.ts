import axios from 'axios';
import { getEnv } from 'js/env';
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


import { prKeycloakClient } from "js/../libs/setup";


export const { axiosAuth } = (() => {

	const axiosAuth = axios.create({ "baseURL": BASE_URL });

	prKeycloakClient.then(keycloakClient=> 
		axiosAuth.interceptors.request.use(
			async config => {

				await keycloakClient.renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired();

				return {
					...(config as any),
					"headers": { 
						...config.headers, 
						"Authorization": `Bearer ${keycloakClient.evtOidcTokens.state!.accessToken}`
					},
					"Content-Type": 'application/json;charset=utf-8',
					"Accept": 'application/json;charset=utf-8',
				};

			},
			error => { throw error; }
		)
	);


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

