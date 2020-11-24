
import axios from "axios";
import type { AxiosInstance } from "axios";
import { join as pathJoin } from "path";
import { partition } from "evt/tools/reducers";
import type { Secret, SecretWithMetadata, VaultClient } from "../ports/VaultClient";
import { Deferred } from "evt/tools/Deferred";
import { StatefulReadonlyEvt } from "evt";
import { Evt, nonNullable } from "evt";
import memoizee from "memoizee";


const version = "v1";

export function createRestImplOfVaultClient(
	params: {
		baseUri: string;
		engine: string;
		role: string;
		evtOidcAccessToken: StatefulReadonlyEvt<string | undefined>;
		renewOidcAccessTokenIfItExpiresSoonOrRedirectToLoginIfAlreadyExpired(): Promise<void>;
	}
): VaultClient {

	const {
		baseUri,
		engine,
		role,
		evtOidcAccessToken,
		renewOidcAccessTokenIfItExpiresSoonOrRedirectToLoginIfAlreadyExpired
	} = params;

	const { axiosInstance, evtVaultToken } = getAxiosInstanceAndEvtVaultToken({
		baseUri,
		role,
		evtOidcAccessToken,
		renewOidcAccessTokenIfItExpiresSoonOrRedirectToLoginIfAlreadyExpired
	})

	const ctxPathJoin = (...args: Parameters<typeof pathJoin>) =>
		pathJoin(version, engine, ...args);

	const vaultClient: VaultClient = {
		"list": async params => {

			const { path } = params;

			const axiosResponse = await axiosInstance.get<{ data: { keys: string[]; } }>(
				ctxPathJoin("metadata", path),
				{ "params": { "list": "true" } }
			);

			const [nodes, leafs] = axiosResponse.data.data.keys
				.reduce(...partition<string>(key => key.endsWith("/")));

			return { nodes, leafs };

		},
		"get": async params => {

			const { path } = params;

			const axiosResponse = await axiosInstance.get<{
				data: {
					data: SecretWithMetadata["secret"];
					metadata: SecretWithMetadata["metadata"]
				}
			}>(
				ctxPathJoin("data", path)
			);

			const { data: { data: secret, metadata } } = axiosResponse.data;

			return { secret, metadata };

		},
		"put": async params => {

			const { path, secret } = params;

			await axiosInstance.put<{ data: Secret; }>(
				ctxPathJoin("data", path),
				{ "data": secret }
			);

		},
		"delete": async params => {

			const { path } = params;

			await axiosInstance.delete(
				ctxPathJoin("data", path)
			);

		},
		engine,
		evtVaultToken
	};

	dVaultClient.resolve(vaultClient);

	return vaultClient;

}

const dVaultClient = new Deferred<VaultClient>();

/** @deprecated */
export const { pr: prVaultClient } = dVaultClient;


function getAxiosInstanceAndEvtVaultToken(
	params: {
		baseUri: string;
		role: string;
	} & Pick<
		Parameters<typeof createRestImplOfVaultClient>[0],
		"evtOidcAccessToken" |
		"renewOidcAccessTokenIfItExpiresSoonOrRedirectToLoginIfAlreadyExpired"
	>
): {
	axiosInstance: AxiosInstance;
	evtVaultToken: StatefulReadonlyEvt<string | undefined>;
} {

	const {
		baseUri,
		role,
		evtOidcAccessToken,
		renewOidcAccessTokenIfItExpiresSoonOrRedirectToLoginIfAlreadyExpired
	} = params;


	const createAxiosInstance = () => axios.create({ "baseURL": baseUri });

	const fetchVaultToken = memoizee(
		async (oidcAccessToken: string): Promise<string> => {

			const axiosResponse = await createAxiosInstance()
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

	const evtVaultToken = Evt.asyncPipe(
		evtOidcAccessToken.evtChange,
		oidcAccessToken => 
			oidcAccessToken === undefined ?
				[ undefined ]:
				fetchVaultToken(oidcAccessToken)
					.then(vaultToken => [vaultToken])
	);

	const axiosInstance = createAxiosInstance();

	axiosInstance.interceptors.request.use(
		async axiosRequestConfig => {

			await renewOidcAccessTokenIfItExpiresSoonOrRedirectToLoginIfAlreadyExpired();

			return {
				...axiosRequestConfig,
				"headers": {
					"X-Vault-Token": await evtVaultToken.waitFor(nonNullable())
				},
				"Content-Type": "application/json;charset=utf-8",
				"Accept": "application/json;charset=utf-8"
			};
		}
	);

	return { axiosInstance, evtVaultToken };

}
