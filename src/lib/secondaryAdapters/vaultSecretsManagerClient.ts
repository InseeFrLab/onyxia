
import axios from "axios";
import type { AxiosInstance } from "axios";
import { join as pathJoin } from "path";
import { partition } from "evt/tools/reducers";
import type { Secret, SecretWithMetadata, SecretsManagerClient, SecretsManagerTranslator } from "../ports/SecretsManagerClient";
import { Deferred } from "evt/tools/Deferred";
import { StatefulReadonlyEvt } from "evt";
import { Evt, nonNullable } from "evt";
import memoizee from "memoizee";


const version = "v1";

type Params = {
	baseUri: string;
	engine: string;
	role: string;
	evtOidcAccessToken: StatefulReadonlyEvt<string | undefined>;
	renewOidcAccessTokenIfItExpiresSoonOrRedirectToLoginIfAlreadyExpired(): Promise<void>;
};

export function createVaultSecretsManagerClient(params: Params): {
	secretsManagerClient: SecretsManagerClient,
	evtVaultToken: StatefulReadonlyEvt<string | undefined>;
} {

	const { engine } = params;

	const { axiosInstance, evtVaultToken } = getAxiosInstanceAndEvtVaultToken(params);

	const ctxPathJoin = (...args: Parameters<typeof pathJoin>) =>
		pathJoin(version, engine, ...args);

	const secretsManagerClient: SecretsManagerClient = {
		"list": async params => {

			const { path } = params;

			const axiosResponse = await axiosInstance.get<{ data: { keys: string[]; } }>(
				ctxPathJoin("metadata", path),
				{ "params": { "list": "true" } }
			);

			let [directories, secrets] = axiosResponse.data.data.keys
				.reduce(...partition<string>(key => key.endsWith("/")));

			return { 
				"directories": directories.map(path => path.split("/")[0]),
				secrets 
			};

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
				ctxPathJoin("metadata", path)
			);

		}
	};

	dVaultClient.resolve(secretsManagerClient);

	return { secretsManagerClient, evtVaultToken };

}

const dVaultClient = new Deferred<SecretsManagerClient>();

/** @deprecated */
export const { pr: prVaultClient } = dVaultClient;

function getAxiosInstanceAndEvtVaultToken(
	params: Pick<
		Params,
		"baseUri" |
		"role" |
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
				[undefined] :
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


export function getVaultClientTranslator(
	params: {
		clientType: "CLI";
		oidcAccessToken: string;
	} & Omit<Parameters<typeof createVaultSecretsManagerClient>[0],
		"evtOidcAccessToken" |
		"renewOidcAccessTokenIfItExpiresSoonOrRedirectToLoginIfAlreadyExpired"
	>
): SecretsManagerTranslator {

	const { clientType, engine, baseUri, oidcAccessToken, role } = params;


	switch (clientType) {
		case "CLI":

			return {
				"initialization": [
					{
						"cmd": `export VAULT_ADDR='${baseUri}'`,
						"result": ""
					},
					{
						"cmd": `vault write auth/jwt/login role=${role} jwt=${oidcAccessToken}`,
						"result": "Success! You are now authenticated!"
					}
				],
				"methods": {
					"list": {
						"buildCmd": (...[{ path }]) =>
							`vault kv list ${pathJoin(engine, path)}`,
						"fmtResult": ({ result: { directories, secrets } }) =>
							[
								"Keys",
								"----",
								...[...directories, ...secrets]
							].join("\n")
					},
					"get": {
						"buildCmd": (...[{ path }]) =>
							`vault kv get ${pathJoin(engine, path)}`,
						"fmtResult": ({ result: secretWithMetadata }) => {

							const n = Math.max(...Object.keys(secretWithMetadata.secret).map(key => key.length)) + 2;

							return [
								"==== Data ====",
								`${"Key".padEnd(n)}Value`,
								`${"---".padEnd(n)}-----`,
								...Object.entries(secretWithMetadata.secret)
									.map(
										([key, value]) =>
											key.padEnd(n) +
											(typeof value === "string" ? value : JSON.stringify(value))
									)
							].join("\n");

						}
					},
					"put": {
						"buildCmd": (...[{ path, secret }]) =>
							[
								`vault kv put ${pathJoin(engine, path)}`,
								...Object.entries(secret).map(
									([key, value]) => `${key}=${typeof value === "string" ?
										`"${value.replace(/"/g, '\\"')}"` :
										typeof value === "number" || typeof value === "boolean" ?
											value :
											[
												"-<<EOF",
												`heredoc > ${JSON.stringify(value, null, 2)}`,
												"heredoc> EOF"
											].join("\n")
										}`
								)
							].join(" \\\n"),
						"fmtResult": ({ inputs: [{ path }] }) =>
							`Success! Data written to: ${pathJoin(engine, path)}`
					},
					"delete": {
						"buildCmd": (...[{ path }]) =>
							`vault kv delete ${pathJoin(engine, path)}`,
						"fmtResult": ({ inputs: [{ path }] }) =>
							`Success! Data deleted (if it existed) at: ${pathJoin(engine, path)}`
					}
				}
			};
	}


}