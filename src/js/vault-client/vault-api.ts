import axios from 'axios';
import generator from 'generate-password';
import { axiosURL } from 'js/utils';
import * as localStorageToken from 'js/utils/localStorageToken';
import { store } from 'js/redux/store';
import { actions as userActions } from "js/redux/user";
import { env } from 'js/env';

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
		store.dispatch(userActions.newVaultData({ data }));
	}
}

export default VaultAPI;

const getLocalToken = () => store.getState().user.VAULT.VAULT_TOKEN;

/**
 *
 */
export const getVaultToken = async () =>
	getLocalToken() ? Promise.resolve(getLocalToken()) : fetchVaultToken();

const fetchVaultToken = async () => {
	//TODO: Remove the response interceptor
	const {
		auth: { client_token: token },
	}: any = await axiosURL.post(`${VAULT_BASE_URI}/v1/auth/jwt/login`, {
		role: 'onyxia-user',
		jwt: localStorageToken.get(),
	});
	store.dispatch(userActions.newVaultToken({ token }));
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
				else store.dispatch(userActions.newVaultData({ data }));
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
		.then(() => store.dispatch(userActions.newVaultData({ "data": payload.data as any })));
};

export const resetVaultPwd = (idep: string) =>
	resetVaultData(idep, { password: buildDefaultPwd() });

/**
 *
 */
const axiosVault = axios.create({
	baseURL: VAULT_BASE_URI,
});
axiosVault.interceptors.request.use(
	(config) =>
		getVaultToken()
			.then((token) => Promise.resolve(authorizeConfig(token)(config)))
			.catch((error) => console.log(`Error ${error}`)),
	(error) => Promise.reject(error)
);

const authorizeConfig = (token: string) => (config: any) => ({
	...config,
	headers: { 'X-Vault-Token': token },
	'Content-Type': 'application/json;charset=utf-8',
	Accept: 'application/json;charset=utf-8',
});
