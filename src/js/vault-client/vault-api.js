import axios from 'axios';
import generator from 'generate-password';
import { axiosAuth, getToken } from 'js/utils';
import { store } from 'js/redux';
import {
	newVaultToken,
	newVaultData,
	newPasswordVersions,
} from 'js/redux/actions';
import conf from '../configuration';

const VAULT_BASE_URI = conf.VAULT.VAULT_BASE_URI;
const VAULT_KV_ENGINE = conf.VAULT.VAULT_KV_ENGINE;
const NB_DAYS_BEFORE_PWD_RENEWAL = conf.VAULT.NB_DAYS_BEFORE_PWD_RENEWAL;

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

	async uploadSecret(path, data) {
		const old = await this.getSecret(path);
		await axiosVault.put(`/v1/${VAULT_KV_ENGINE}/data${path}`, {
			data: { ...old, ...data },
		});
		store.dispatch(newVaultData(data));
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

const buildDefaultPwd = () =>
	generator.generate({
		length: 20,
		numbers: true,
	});

export const initVaultData = (idep, name, mail) => {
	axiosVault(
		`${VAULT_BASE_URI}/v1/${VAULT_KV_ENGINE}/data/${idep}/.onyxia/profile`
	)
		.then(({ data: { data } }) => {
			const {
				password,
				git_user_name,
				git_user_mail,
				git_credentials_cache_duration,
			} = data.data;
			const created_time = data.metadata.created_time;
			if (
				!password ||
				!git_user_name ||
				!git_user_mail ||
				!git_credentials_cache_duration ||
				pwdMustBeRenewed(created_time)
			)
				resetVaultData(idep, {
					password:
						(pwdMustBeRenewed(created_time) ? buildDefaultPwd() : password) ||
						buildDefaultPwd(),
					git_user_name: git_user_name || name,
					git_user_mail: git_user_mail || mail,
					git_credentials_cache_duration: git_credentials_cache_duration || '0',
				});
			else store.dispatch(newVaultData(data));
		})
		.catch(() => {
			resetVaultData(idep, undefined, name, mail);
		});
};

const pwdMustBeRenewed = (createdTime) => {
	return (
		NB_DAYS_BEFORE_PWD_RENEWAL > 0 &&
		Date.now() - Date.parse(createdTime) >
			24 * 60 * 60 * 1000 * NB_DAYS_BEFORE_PWD_RENEWAL
	);
};

const getLocalPasswordVersions = () =>
	store.getState().user.VAULT.PASSWORD_VERSION;

export const getVersionsList = async (idep) =>
	getLocalPasswordVersions()
		? Promise.resolve(getLocalPasswordVersions())
		: fetchPasswordVersions(idep);

const fetchPasswordVersions = async (idep) => {
	const {
		data: {
			data: { versions },
		},
	} = await axiosVault.get(
		`${VAULT_BASE_URI}/v1/${VAULT_KV_ENGINE}/metadata/${idep}/.onyxia/profile`
	);
	store.dispatch(newPasswordVersions(Object.keys(versions)));
	return Object.keys(versions);
};

export const resetVaultData = (idep, data) => {
	const payload = { data };
	axiosVault
		.post(`/v1/${VAULT_KV_ENGINE}/data/${idep}/.onyxia/profile`, payload)
		.then(() => store.dispatch(newVaultData(payload.data)));
};

export const getPasswordByVersion = async (idep, version) => {
	const {
		data: {
			data: {
				data: { password },
			},
		},
	} = await axiosVault.get(
		`${VAULT_BASE_URI}/v1/${VAULT_KV_ENGINE}/data/${idep}/.onyxia/profile?version=${version}`
	);
	return Promise.resolve(password);
};

export const resetVaultPwd = (idep) =>
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

const authorizeConfig = (token) => (config) => ({
	...config,
	headers: { 'X-Vault-Token': token },
	'Content-Type': 'application/json;charset=utf-8',
	Accept: 'application/json;charset=utf-8',
});
