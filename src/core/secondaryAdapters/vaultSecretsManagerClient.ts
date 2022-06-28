import axios from "axios";
import { join as pathJoin } from "path";
import { partition } from "evt/tools/reducers";
import type {
    Secret,
    SecretWithMetadata,
    SecretsManagerClient,
} from "../ports/SecretsManagerClient";
import { Deferred } from "evt/tools/Deferred";
import type { ReturnType } from "tsafe";
import { createKeycloakOidcClient } from "./keycloakOidcClient";
import { getNewlyRequestedOrCachedTokenFactory } from "core/tools/getNewlyRequestedOrCachedToken";
import { id } from "tsafe/id";
import { ApiLogger } from "core/tools/apiLogger";
import type { NonPostableEvt } from "evt";
import type { OidcClient } from "../ports/OidcClient";
import { assert } from "tsafe/assert";

const version = "v1";

type Params = {
    url: string;
    engine: string;
    role: string;
    oidc:
        | {
              type: "keycloak params";
              keycloakParams: {
                  url: string;
                  realm: string;
                  clientId: string;
              };
              evtUserActivity: NonPostableEvt<void>;
          }
        | {
              type: "oidc client";
              oidcClient: OidcClient.LoggedIn;
          };
};

export async function createVaultSecretsManagerClient(
    params: Params,
): Promise<SecretsManagerClient> {
    const { url, engine, role, oidc } = params;

    const oidcClient = await (async () => {
        switch (oidc.type) {
            case "oidc client":
                return oidc.oidcClient;
            case "keycloak params": {
                const oidcClient = await createKeycloakOidcClient({
                    ...oidc.keycloakParams,
                    "transformUrlBeforeRedirectToLogin": undefined,
                    "evtUserActivity": oidc.evtUserActivity,
                });

                if (!oidcClient.isUserLoggedIn) {
                    await oidcClient.login({ "doesCurrentHrefRequiresAuth": true });
                    assert(false);
                }

                return oidcClient;
            }
        }
    })();

    const createAxiosInstance = () => axios.create({ "baseURL": url });

    const { getNewlyRequestedOrCachedToken } = getNewlyRequestedOrCachedTokenFactory({
        "requestNewToken": async () => {
            const now = Date.now();

            const {
                data: { auth },
            } = await createAxiosInstance().post<{
                auth: { lease_duration: number; client_token: string };
            }>(`/${version}/auth/jwt/login`, {
                role,
                "jwt": oidcClient.accessToken,
            });

            return id<ReturnType<SecretsManagerClient["getToken"]>>({
                "token": auth.client_token,
                "expirationTime": now + auth.lease_duration * 1000,
                "acquisitionTime": now,
            });
        },
        "returnCachedTokenIfStillValidForXPercentOfItsTTL": "90%",
    });

    const { axiosInstance } = (() => {
        const axiosInstance = createAxiosInstance();

        axiosInstance.interceptors.request.use(async axiosRequestConfig => ({
            ...axiosRequestConfig,
            "headers": {
                "X-Vault-Token": (await getNewlyRequestedOrCachedToken()).token,
            },
            "Content-Type": "application/json;charset=utf-8",
            "Accept": "application/json;charset=utf-8",
        }));

        return { axiosInstance };
    })();

    const ctxPathJoin = (...args: Parameters<typeof pathJoin>) =>
        pathJoin(version, engine, ...args);

    const secretsManagerClient: SecretsManagerClient = {
        "list": async ({ path }) => {
            const axiosResponse = await axiosInstance.get<{
                data: { keys: string[] };
            }>(ctxPathJoin("metadata", path), { "params": { "list": "true" } });

            const [directories, files] = axiosResponse.data.data.keys.reduce(
                ...partition<string>(key => key.endsWith("/")),
            );

            return {
                "directories": directories.map(path => path.split("/")[0]),
                files,
            };
        },
        "get": async ({ path }) => {
            const axiosResponse = await axiosInstance.get<{
                data: {
                    data: SecretWithMetadata["secret"];
                    metadata: SecretWithMetadata["metadata"];
                };
            }>(ctxPathJoin("data", path));

            const {
                data: { data: secret, metadata },
            } = axiosResponse.data;

            return { secret, metadata };
        },
        "put": async ({ path, secret }) => {
            await axiosInstance.put<{ data: Secret }>(ctxPathJoin("data", path), {
                "data": secret,
            });
        },
        "delete": async ({ path }) => {
            await axiosInstance.delete(ctxPathJoin("metadata", path));
        },
        "getToken": getNewlyRequestedOrCachedToken,
    };

    dVaultClient.resolve(secretsManagerClient);

    return secretsManagerClient;
}

const dVaultClient = new Deferred<SecretsManagerClient>();

/** @deprecated */
export const { pr: prVaultClient } = dVaultClient;

export function getVaultApiLogger(params: {
    clientType: "CLI";
    engine: string;
}): ApiLogger<SecretsManagerClient> {
    const { clientType, engine } = params;

    switch (clientType) {
        case "CLI":
            return {
                "initialHistory": [],
                "methods": {
                    "list": {
                        "buildCmd": (...[{ path }]) =>
                            `vault kv list ${pathJoin(engine, path)}`,
                        "fmtResult": ({ result: { directories, files } }) =>
                            [
                                "Keys",
                                "----",
                                ...[
                                    ...directories.map(directory => `${directory}/`),
                                    ...files,
                                ],
                            ].join("\n"),
                    },
                    "get": {
                        "buildCmd": (...[{ path }]) =>
                            `vault kv get ${pathJoin(engine, path)}`,
                        "fmtResult": ({ result: secretWithMetadata }) => {
                            const n =
                                Math.max(
                                    ...Object.keys(secretWithMetadata.secret).map(
                                        key => key.length,
                                    ),
                                ) + 2;

                            return [
                                "==== Data ====",
                                `${"Key".padEnd(n)}Value`,
                                `${"---".padEnd(n)}-----`,
                                ...Object.entries(secretWithMetadata.secret).map(
                                    ([key, value]) =>
                                        key.padEnd(n) +
                                        (typeof value === "string"
                                            ? value
                                            : JSON.stringify(value)),
                                ),
                            ].join("\n");
                        },
                    },
                    "put": {
                        "buildCmd": (...[{ path, secret }]) =>
                            [
                                `vault kv put ${pathJoin(engine, path)}`,
                                ...Object.entries(secret).map(
                                    ([key, value]) =>
                                        `${key}=${
                                            typeof value === "string"
                                                ? `"${value.replace(/"/g, '\\"')}"`
                                                : typeof value === "number" ||
                                                  typeof value === "boolean"
                                                ? value
                                                : [
                                                      "-<<EOF",
                                                      `heredoc > ${JSON.stringify(
                                                          value,
                                                          null,
                                                          2,
                                                      )}`,
                                                      "heredoc> EOF",
                                                  ].join("\n")
                                        }`,
                                ),
                            ].join(" \\\n"),
                        "fmtResult": ({ inputs: [{ path }] }) =>
                            `Success! Data written to: ${pathJoin(engine, path)}`,
                    },
                    "delete": {
                        "buildCmd": (...[{ path }]) =>
                            `vault kv delete ${pathJoin(engine, path)}`,
                        "fmtResult": ({ inputs: [{ path }] }) =>
                            `Success! Data deleted (if it existed) at: ${pathJoin(
                                engine,
                                path,
                            )}`,
                    },
                    "getToken": {
                        "buildCmd": () =>
                            [
                                `# We generate a token`,
                                `# See https://www.vaultproject.io/docs/auth/jwt`,
                            ].join("\n"),
                        "fmtResult": ({ result: vaultToken }) =>
                            `The token we got is ${vaultToken}`,
                    },
                },
            };
    }
}
