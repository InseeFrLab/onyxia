import axios, { AxiosHeaders } from "axios";
import { join as pathJoin } from "pathe";
import { partition } from "evt/tools/reducers";
import type {
    Secret,
    SecretWithMetadata,
    SecretsManager
} from "core/ports/SecretsManager";
import type { ReturnType } from "tsafe";
import {
    getNewlyRequestedOrCachedTokenFactory,
    createSessionStorageTokenPersistance
} from "core/tools/getNewlyRequestedOrCachedToken";
import type { Oidc } from "core/ports/Oidc";
import { fnv1aHashToHex } from "core/tools/fnv1aHashToHex";

const version = "v1";

type Params = {
    url: string;
    kvEngine: string;
    role: string;
    oidc: Oidc.LoggedIn;
    /**
     * Default: 'jwt'
     * When it's 'jwt' we will request /v1/auth/jwt/login
     */
    authPath: string | undefined;
};

export async function createSecretManager(params: Params): Promise<SecretsManager> {
    const { url, kvEngine, role, oidc, authPath = "jwt" } = params;

    const createAxiosInstance = () => axios.create({ baseURL: url });

    const { getNewlyRequestedOrCachedToken, clearCachedToken } =
        getNewlyRequestedOrCachedTokenFactory({
            persistance: createSessionStorageTokenPersistance<
                ReturnType<SecretsManager["getToken"]>
            >({
                sessionStorageKey:
                    "vaultToken_" +
                    fnv1aHashToHex(
                        (() => {
                            const { url, authPath, role } = params;

                            return JSON.stringify({ url, authPath, role, version });
                        })()
                    )
            }),
            requestNewToken: async () => {
                const now = Date.now();

                const {
                    data: { auth }
                } = await createAxiosInstance().post<{
                    auth: { lease_duration: number; client_token: string };
                }>(`/${version}/auth/${authPath}/login`, {
                    role,
                    jwt: (await oidc.getTokens()).accessToken
                });

                return {
                    token: auth.client_token,
                    expirationTime: now + auth.lease_duration * 1000,
                    acquisitionTime: now
                };
            },
            returnCachedTokenIfStillValidForXPercentOfItsTTL: "90%"
        });

    if (oidc.isNewBrowserSession) {
        clearCachedToken();
    }

    const { axiosInstance } = (() => {
        const axiosInstance = createAxiosInstance();

        axiosInstance.interceptors.request.use(async axiosRequestConfig => {
            const headers = AxiosHeaders.from(axiosRequestConfig.headers);

            headers.set("X-Vault-Token", (await getNewlyRequestedOrCachedToken()).token);
            headers.set("Content-Type", "application/json;charset=utf-8");
            headers.set("Accept", "application/json;charset=utf-8");

            return {
                ...axiosRequestConfig,
                headers
            };
        });

        return { axiosInstance };
    })();

    const ctxPathJoin = (...args: Parameters<typeof pathJoin>) =>
        pathJoin(version, kvEngine, ...args);

    const secretsManager: SecretsManager = {
        list: async ({ path }) => {
            const axiosResponse = await axiosInstance.get<{
                data: { keys: string[] };
            }>(ctxPathJoin("metadata", path), { params: { list: "true" } });

            const [directories, files] = axiosResponse.data.data.keys.reduce(
                ...partition<string>(key => key.endsWith("/"))
            );

            return {
                directories: directories.map(path => path.split("/")[0]),
                files
            };
        },
        get: async ({ path }) => {
            const axiosResponse = await axiosInstance.get<{
                data: {
                    data: SecretWithMetadata["secret"];
                    metadata: SecretWithMetadata["metadata"];
                };
            }>(ctxPathJoin("data", path));

            const {
                data: { data: secret, metadata }
            } = axiosResponse.data;

            return { secret, metadata };
        },
        put: async ({ path, secret }) => {
            await axiosInstance.put<{ data: Secret }>(ctxPathJoin("data", path), {
                data: secret
            });
        },
        delete: async ({ path }) => {
            await axiosInstance.delete(ctxPathJoin("metadata", path));
        },
        getToken: async params => {
            const { doForceRefresh } = params ?? {};

            if (doForceRefresh) {
                await clearCachedToken();
            }

            return getNewlyRequestedOrCachedToken();
        }
    };

    return secretsManager;
}
