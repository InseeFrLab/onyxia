import axios from 'axios';
import generator from 'generate-password';
import { axiosURL } from "js/utils/axios-config";
import * as localStorageToken from 'js/utils/localStorageToken';
import { env } from 'js/env';
import memoize from "memoizee";

/** We avoid importing app right away to prevent require cycles */
export const getStore = memoize(
	() => import("js/redux/store"),
	{ "promise": true }
);

const VAULT_BASE_URI = env.VAULT.VAULT_BASE_URI;
const VAULT_KV_ENGINE = env.VAULT.VAULT_KV_ENGINE;


interface VaultProfile {
	password?: string;
	git_user_name?: string;
	git_user_mail?: string;
	git_credentials_cache_duration?: string;
}

class VaultAPI {
	async getSecretsList(path = '') {
		// This ts ignore is due to the fact we use an interceptor
		// to return the data instead of an object containing the data
		// @ts-ignore
		const { data } = await axiosVault({
			method: 'list',
			url: `/v1/${VAULT_KV_ENGINE}/metadata${path}`,
		});
		return data.data ? data.data.keys : [];
	}

	async getSecret(path = '') {
		const { data } = await axiosVault({
			method: 'get',
			url: `/v1/${VAULT_KV_ENGINE}/data${path}`,
		});
		return data.data.data ? data.data.data : [];
	}

	async createPath(path: string, payload: any) {
		return axiosVault.put(
			`/v1/${VAULT_KV_ENGINE}/data${path}`,
			payload || { data: { foo: 'bar' } }
		);
	}

	async uploadSecret(path: string, data: any) {
		const old = await this.getSecret(path);
		await axiosVault.put(`/v1/${VAULT_KV_ENGINE}/data${path}`, {
			data: { ...old, ...data },
		});

		const { store, actions } = await getStore();
		store.dispatch(actions.newVaultData({ data }));
	}
}

export default VaultAPI;


/**
 *
 */
export const getVaultToken = async (): Promise<string> => {

	const { store } = await getStore();

	const { VAULT_TOKEN } = store.getState().user.VAULT;

	return VAULT_TOKEN ?? fetchVaultToken();

}

const fetchVaultToken = async () => {
	//TODO: Remove the response interceptor
	const {
		auth: { client_token: token },
	}: any = await axiosURL.post(`${VAULT_BASE_URI}/v1/auth/jwt/login`, {
		role: 'onyxia-user',
		jwt: localStorageToken.get(),
	});
	const { store, actions } = await getStore();
	store.dispatch(actions.newVaultToken({ token }));
	return token;
};

const buildDefaultPwd = () =>
	generator.generate({
		length: 20,
		numbers: true,
	});

export const initVaultData = (idep: string, name: string, mail: string) => {
	axiosVault(
		`${VAULT_BASE_URI}/v1/${VAULT_KV_ENGINE}/data/${idep}/.onyxia/profile`
	)
		.then(
			({
				data: {
					data: { data },
				},
			}) => {
				const {
					password,
					git_user_name,
					git_user_mail,
					git_credentials_cache_duration,
				} = data;
				if (
					!password ||
					!git_user_name ||
					!git_user_mail ||
					!git_credentials_cache_duration
				)
					resetVaultData(idep, {
						password: password || buildDefaultPwd(),
						git_user_name: git_user_name || name,
						git_user_mail: git_user_mail || mail,
						git_credentials_cache_duration:
							git_credentials_cache_duration || '0',
					});
				else getStore().then(({ store, actions }) => store.dispatch(actions.newVaultData({ data })));
			}
		)
		.catch(() => {
			resetVaultData(idep, {
				password: buildDefaultPwd(),
				git_user_name: name,
				git_user_mail: mail,
				git_credentials_cache_duration: '0',
			});
		});
};

export const resetVaultData = (idep: string, data: VaultProfile) => {
	const payload = { data };
	axiosVault
		.post(`/v1/${VAULT_KV_ENGINE}/data/${idep}/.onyxia/profile`, payload)
		.then(() => getStore())
		.then(({ store, actions }) => store.dispatch(actions.newVaultData({ "data": payload.data as any })));
};

export const resetVaultPwd = (idep: string) =>
	resetVaultData(idep, { password: buildDefaultPwd() });

const { axiosVault } = (() => {

	const axiosVault = axios.create({ "baseURL": VAULT_BASE_URI });

	axiosVault.interceptors.request.use(
		async axiosRequestConfig => ({
			...axiosRequestConfig,
			"headers": { 'X-Vault-Token': await getVaultToken() },
			"Content-Type": "application/json;charset=utf-8",
			"Accept": "application/json;charset=utf-8"
		}),
	);

	return { axiosVault };

})();


