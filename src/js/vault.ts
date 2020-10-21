import axios from 'axios';
import generator from 'generate-password';
import { locallyStoredOidcAccessToken } from 'js/utils/locallyStoredOidcAccessToken';
import { env } from 'js/env';
import memoize from "memoizee";
import { id } from "evt/tools/typeSafety/id";
import { assert } from "evt/tools/typeSafety/assert";


/** We avoid importing app right away to prevent require cycles */
const getStore = memoize(
	() => import("js/redux/store"),
	{ "promise": true }
);

const VAULT_BASE_URI = env.VAULT.VAULT_BASE_URI;
const VAULT_KV_ENGINE = env.VAULT.VAULT_KV_ENGINE;

async function getVaultToken(): Promise<string> {

	const { store, actions } = await getStore();

	const { VAULT_TOKEN } = store.getState().user.VAULT;

	if (VAULT_TOKEN) {
		return VAULT_TOKEN;
	}

	const { oidcAccessToken } = locallyStoredOidcAccessToken.get();

	assert(oidcAccessToken !== undefined, "Used should be logged in");

	store.dispatch(
		actions.newVaultToken({
			"token":
				await axios.create({ "baseURL": VAULT_BASE_URI })
					.post(
						`/v1/auth/jwt/login`,
						{
							"role": "onyxia-user",
							"jwt": oidcAccessToken
						}
					).then(axiosResponse => axiosResponse.data.auth.client_token)
		})
	);

	return getVaultToken();

}

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

export type VaultProfile = {
	password: string;
	git_user_name: string;
	git_user_mail: string;
	git_credentials_cache_duration: string;
};

const buildDefaultPwd = () =>
	generator.generate({
		"length": 20,
		"numbers": true
	});

const setOrUpdateVaultProfile = async (
	params: {
		parsedOidcAccessTokenPreferredUsername: string;
		vaultProfile: Partial<VaultProfile>;
	}
) => {

	const { parsedOidcAccessTokenPreferredUsername, vaultProfile } = params;

	await axiosVault.post(
		`/v1/${VAULT_KV_ENGINE}/data/${parsedOidcAccessTokenPreferredUsername}/.onyxia/profile`,
		{ "data": vaultProfile }
	);

	const { store, actions } = await getStore();

	store.dispatch(actions.newVaultData({ "data": vaultProfile }));

};


/** Assert user logged in ( Valid Access Token in local storage ) */
export const vaultApi = {
	"getSecretsList": async (params?: { path: string; }) => {

		const { path = "" } = params ?? {};

		const { data } = await axiosVault({
			//Yes LIST as HTTP verb, it's not a mistake.
			"method": "list" as any,
			"url": `/v1/${VAULT_KV_ENGINE}/metadata${path}`,
		});

		return data?.data.keys ?? [];

	},
	"getSecret": async (params?: { path: string; }) => {

		const { path = "" } = params ?? {};

		const { data } = await axiosVault({
			"method": "get",
			"url": `/v1/${VAULT_KV_ENGINE}/data${path}`,
		});
		return data.data.data ?? [];
	},

	"createPath": (
		params: {
			path: string,
			data?: Record<string, string>;
		}
	) => {

		const {
			path,
			data = { "foo": "bar" }
		} = params;

		return axiosVault.put(
			`/v1/${VAULT_KV_ENGINE}/data${path}`,
			{ data }
		);
	},
	"uploadSecret": async (
		params: {
			path: string,
			data: Record<string, string>;
		}
	) => {

		const { path, data } = params;

		await axiosVault.put(`/v1/${VAULT_KV_ENGINE}/data${path}`, {
			"data": {
				...(await vaultApi.getSecret({ path })),
				...data
			},
		});

		const { store, actions } = await getStore();

		store.dispatch(actions.newVaultData({ data }));
	},
	"resetVaultPwd": () =>
		setOrUpdateVaultProfile({
			"parsedOidcAccessTokenPreferredUsername": 
				locallyStoredOidcAccessToken.getParsed().preferred_username,
			"vaultProfile": {
				"password": buildDefaultPwd()
			}
		})
};

/** Assert user logged in ( Valid Access Token in local storage ) */
export async function initVaultData() {

	const parsedOidcAccessToken= locallyStoredOidcAccessToken.getParsed();

	const maybeVaultProfile: VaultProfile | {} = await axiosVault([
		`/v1/${VAULT_KV_ENGINE}/data`,
		parsedOidcAccessToken.preferred_username,
		".onyxia/profile"
	].join("/"))
		.then(axiosResponse => axiosResponse.data?.data?.data ?? {});

	if (!("password" in maybeVaultProfile)) {

		await setOrUpdateVaultProfile({
			"parsedOidcAccessTokenPreferredUsername": parsedOidcAccessToken.preferred_username,
			"vaultProfile": id<VaultProfile>({
				"password": buildDefaultPwd(),
				"git_user_name": parsedOidcAccessToken.name,
				"git_user_mail": parsedOidcAccessToken.email,
				"git_credentials_cache_duration": "0"
			})
		});

		return;

	}

	const { store, actions } = await getStore();

	store.dispatch(actions.newVaultData({ "data": maybeVaultProfile }));


}






