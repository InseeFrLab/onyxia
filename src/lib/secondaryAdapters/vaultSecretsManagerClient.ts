import axios from "axios";
import type { AxiosInstance } from "axios";
import { join as pathJoin } from "path";
import { partition } from "evt/tools/reducers";
import type {
    Secret,
    SecretWithMetadata,
    SecretsManagerClient,
    SecretsManagerTranslator,
} from "../ports/SecretsManagerClient";
import { Deferred } from "evt/tools/Deferred";
import { createKeycloakOidcClient } from "./keycloakOidcClient";
import { Param0 } from "tsafe";

const version = "v1";

type Params = {
    baseUri: string;
    engine: string;
    role: string;
    keycloakParams: Param0<typeof createKeycloakOidcClient>;
};

export function createVaultSecretsManagerClient(params: Params): SecretsManagerClient {
    const { engine, ...rest } = params;

    const { axiosInstance, getFreshVaultToken } = xxx(rest);

    const ctxPathJoin = (...args: Parameters<typeof pathJoin>) =>
        pathJoin(version, engine, ...args);

    const secretsManagerClient: SecretsManagerClient = {
        "list": async params => {
            const { path } = params;

            const axiosResponse = await axiosInstance.get<{
                data: { keys: string[] };
            }>(ctxPathJoin("metadata", path), { "params": { "list": "true" } });

            let [directories, secrets] = axiosResponse.data.data.keys.reduce(
                ...partition<string>(key => key.endsWith("/")),
            );

            return {
                "directories": directories.map(path => path.split("/")[0]),
                secrets,
            };
        },
        "get": async params => {
            const { path } = params;

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
        "put": async params => {
            const { path, secret } = params;

            await axiosInstance.put<{ data: Secret }>(ctxPathJoin("data", path), {
                "data": secret,
            });
        },
        "delete": async params => {
            const { path } = params;

            await axiosInstance.delete(ctxPathJoin("metadata", path));
        },
    };

    dVaultClient.resolve(secretsManagerClient);

    return secretsManagerClient;
}

const dVaultClient = new Deferred<SecretsManagerClient>();

/** @deprecated */
export const { pr: prVaultClient } = dVaultClient;

function xxx(params: {
    baseUri: string;
    role: string;
    getOidcAccessToken: () => Promise<string>;
}): {
    axiosInstance: AxiosInstance;
    getToken: () => Promise<string>;
} {
    const { baseUri, role, getOidcAccessToken } = params;

    const dTokensValidityMs = new Deferred<number>();

    const createAxiosInstance = () => axios.create({ "baseURL": baseUri });

    let cache:
        | Readonly<{
              token: string;
              createTime: number;
          }>
        | undefined = undefined;

    async function requestNewToken() {
        const {
            data: { auth },
        } = await createAxiosInstance().post(`/${version}/auth/jwt/login`, {
            role,
            "jwt": await getOidcAccessToken(),
        });

        if (dTokensValidityMs.isPending) {
            dTokensValidityMs.resolve(auth.lease_duration);
        }

        return auth.client_token;
    }

    const axiosInstance = createAxiosInstance();

    axiosInstance.interceptors.request.use(async axiosRequestConfig => ({
        ...axiosRequestConfig,
        "headers": {
            "X-Vault-Token": await requestNewToken(),
        },
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json;charset=utf-8",
    }));

    return { axiosInstance, getFreshVaultToken };
}

export function getVaultClientTranslator(params: {
    clientType: "CLI";
    engine: string;
}): SecretsManagerTranslator {
    const { clientType, engine } = params;

    switch (clientType) {
        case "CLI":
            return {
                "initialHistory": [],
                "methods": {
                    "list": {
                        "buildCmd": (...[{ path }]) =>
                            `vault kv list ${pathJoin(engine, path)}`,
                        "fmtResult": ({ result: { directories, secrets } }) =>
                            [
                                "Keys",
                                "----",
                                ...[
                                    ...directories.map(directory => `${directory}/`),
                                    ...secrets,
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
