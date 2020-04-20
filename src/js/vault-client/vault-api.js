import axios from 'axios';
import generator from 'generate-password';
import { axiosAuth, getToken } from 'js/utils';
import { store } from 'js/redux';
import { newVaultToken, newVaultData } from 'js/redux/actions';
import conf from '../configuration';

const VAULT_BASE_URI = conf.VAULT.VAULT_BASE_URI;
const VAULT_KV_ENGINE = conf.VAULT.VAULT_KV_ENGINE;

class VaultAPI {
	async getSecretsList(path = '') {
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

	async createPath(path, payload) {
		return axiosVault.put(
			`/v1/${VAULT_KV_ENGINE}/data${path}`,
			payload || { data: { foo: 'bar' } }
		);
	}

	async uploadSecret(path, payload) {
		const { data } = await axiosVault.put(
			`/v1/${VAULT_KV_ENGINE}/data${path}`,
			payload
		);
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

export const initVaultProfile = (idep) => {
	axiosVault(
		`${VAULT_BASE_URI}/v1/${VAULT_KV_ENGINE}/data/${idep}/.onyxia/profile`
	)
		.then(({ data: { data: { data } } }) => store.dispatch(newVaultData(data)))
		.catch(() => {
			resetVaultPwd(idep);
		});

	axiosVault(`${VAULT_BASE_URI}/v1/${VAULT_KV_ENGINE}/data/${idep}/.onyxia/git`)
		.then(({ data: { data: { data } } }) => store.dispatch(newVaultData(data)))
		.catch(() => {
			const { USERMAIL, USERNAME } = store.getState().user;
			initVaultGit(idep, USERMAIL, USERNAME);
		});
};

export const initVaultGit = async (idep, USERMAIL, USERNAME) => {
	const {
		data,
	} = await axiosVault.put(
		`${VAULT_BASE_URI}/v1/${VAULT_KV_ENGINE}/data/${idep}/.onyxia/git`,
		{ data: { email: USERMAIL, username: USERNAME } }
	);
	return data.data ? data.data : [];
};

export const resetVaultPwd = (idep) => {
	const password = generator.generate({
		length: 20,
		numbers: true,
	});
	const data = { data: { password } };
	axiosVault
		.post(`/v1/${VAULT_KV_ENGINE}/data/${idep}/.onyxia/profile`, data)
		.then(() => store.dispatch(newVaultData(data.data)));
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
