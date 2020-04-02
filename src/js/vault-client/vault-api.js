import axios from 'axios';
import generator from 'generate-password';
import { axiosAuth, getToken } from 'js/utils';
import { store } from 'js/redux';
import { newVaultToken } from 'js/redux/actions';
import conf from '../configuration';

const VAULT_BASE_URI = conf.VAULT.VAULT_BASE_URI;

class VaultAPI {
	async getSecretsList(path = '') {
		const { data } = await axiosVault({
			method: 'list',
			url: `/v1/onyxia-kv${path}`,
		});
		return data.data ? data.data.keys : [];
	}

	async getSecret(path = '') {
		const { data } = await axiosVault({
			method: 'get',
			url: `/v1/onyxia-kv${path}`,
		});
		return data.data ? data.data : [];
	}

	async createPath(path, payload) {
		return axiosVault.put(`/v1/onyxia-kv${path}`, payload || { foo: 'bar' });
	}

	async uploadSecret(path, payload) {
		const { data } = await axiosVault.put(`/v1/onyxia-kv${path}`, payload);
		return data.data ? data.data : [];
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
	const {
		auth: { client_token: token },
	} = await axiosAuth.post(`${VAULT_BASE_URI}/v1/auth/jwt/login`, {
		role: 'onyxia-user',
		jwt: await getToken(),
	});
	store.dispatch(newVaultToken(token));
	return token;
};

export const initVaultPwd = (idep) => {
	axiosVault(`${VAULT_BASE_URI}/v1/onyxia-kv/${idep}/.onyxia/profile`).catch(
		() => {
			var password = generator.generate({
				length: 20,
				numbers: true,
			});
			axiosVault.post(`/v1/onyxia-kv/${idep}/.onyxia/profile`, {
				password,
			});
		}
	);
};

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

const authorizeConfig = (token) => (config) => ({
	...config,
	headers: { 'X-Vault-Token': token },
	'Content-Type': 'application/json;charset=utf-8',
	Accept: 'application/json;charset=utf-8',
});
