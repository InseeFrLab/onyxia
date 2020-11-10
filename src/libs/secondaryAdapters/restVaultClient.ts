
import axios from "axios";
import type { AxiosInstance } from "axios";
import memoize from "memoizee";
import { join as pathJoin } from "path";
import { partition } from "evt/tools/reducers";
import type { Secret, SecretWithMetadata, VaultClient } from "../ports/VaultClient";

const version = "v1";

export function createInMemoryImplOfVaultClient(
	params: {
		baseUri: string;
		engine: string;
		role: string;
		oidcAccessToken: string;
	}
): VaultClient {

	const { baseUri, engine, role, oidcAccessToken } = params;

	const { axiosInstance } = getAxiosInstance({
		baseUri,
		engine,
		role,
		oidcAccessToken
	})

	return {
		"config": {
			engine
		},
		"list": async params => {

			const { path } = params;

			const axiosResponse = await axiosInstance.get<{ data: { keys: string[]; } }>(
				pathJoin(version, "metadata", path),
				{ "params": { "list": "true" } }
			);


			const [nodes, leafs] = axiosResponse.data.data.keys
				.reduce(...partition<string>(key => key.endsWith("/")));

			return { nodes, leafs };

		},
		"get": async params => {

			const { path } = params;

			const axiosResponse = await axiosInstance.get<{ data: SecretWithMetadata; }>(
				pathJoin(version, "data", path)
			);

			const { data: secret } = axiosResponse.data;

			return secret;

		},
		"put": async params => {

			const { path, secret } = params;

			await axiosInstance.put<{ data: Secret; }>(
				pathJoin(version, "data", path),
				{ "data": secret }
			);

		},
		"delete": async params => {

			const { path } = params;

			await axiosInstance.delete(pathJoin(version, "data", path));

		}
	};

}


function getAxiosInstance(
	params: {
		baseUri: string;
		engine: string;
		role: string;
		oidcAccessToken: string;
	}
): { axiosInstance: AxiosInstance; } {

	const { baseUri, engine, role, oidcAccessToken } = params;

	const axiosInstance = axios.create({ "baseURL": baseUri });

	const getVaultToken = memoize(
		async () => {

			const axiosResponse = await axiosInstance
				.post(
					`/${version}/auth/jwt/login`,
					{
						role,
						"jwt": oidcAccessToken
					}
				);

			return axiosResponse.data.auth.client_token;

		},
		{ "promise": true }
	);

	axiosInstance.interceptors.request.use(
		async axiosRequestConfig => ({
			...axiosRequestConfig,
			"headers": {
				"X-Vault-Token": await getVaultToken(),
				"X-Vault-Namespace": engine
			},
			"Content-Type": "application/json;charset=utf-8",
			"Accept": "application/json;charset=utf-8"
		}),
	);

	return { axiosInstance };

}
