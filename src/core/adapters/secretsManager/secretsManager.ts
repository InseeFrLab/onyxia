import axios from "axios";
import { join as pathJoin } from "path";
import { partition } from "evt/tools/reducers";
import type {
    Secret,
    SecretWithMetadata,
    SecretsManager
} from "../../ports/SecretsManager";
import type { ReturnType } from "tsafe";
import { getNewlyRequestedOrCachedTokenFactory } from "core/tools/getNewlyRequestedOrCachedToken";
import { id } from "tsafe/id";
import type { Oidc } from "../../ports/Oidc";

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

    const createAxiosInstance = () => axios.create({ "baseURL": url });

    const { getNewlyRequestedOrCachedToken, clearCachedToken } =
        getNewlyRequestedOrCachedTokenFactory({
            "requestNewToken": async () => {
                const now = Date.now();

                const {
                    data: { auth }
                } = await createAxiosInstance().post<{
                    auth: { lease_duration: number; client_token: string };
                }>(`/${version}/auth/${authPath}/login`, {
                    role,
                    "jwt": oidc.getAccessToken().accessToken
                });

                return id<ReturnType<SecretsManager["getToken"]>>({
                    "token": auth.client_token,
                    "expirationTime": now + auth.lease_duration * 1000,
                    "acquisitionTime": now
                });
            },
            "returnCachedTokenIfStillValidForXPercentOfItsTTL": "90%"
        });

    const { axiosInstance } = (() => {
        const axiosInstance = createAxiosInstance();

        axiosInstance.interceptors.request.use(async axiosRequestConfig => ({
            ...axiosRequestConfig,
            "headers": {
                "X-Vault-Token": (await getNewlyRequestedOrCachedToken()).token
            },
            "Content-Type": "application/json;charset=utf-8",
            "Accept": "application/json;charset=utf-8"
        }));

        return { axiosInstance };
    })();

    const ctxPathJoin = (...args: Parameters<typeof pathJoin>) =>
        pathJoin(version, kvEngine, ...args);

    const secretsManager: SecretsManager = {
        "list": async ({ path }) => {
            const axiosResponse = await axiosInstance.get<{
                data: { keys: string[] };
            }>(ctxPathJoin("metadata", path), { "params": { "list": "true" } });

            const [directories, files] = axiosResponse.data.data.keys.reduce(
                ...partition<string>(key => key.endsWith("/"))
            );

            return {
                "directories": directories.map(path => path.split("/")[0]),
                files
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
                data: { data: secret, metadata }
            } = axiosResponse.data;

            return { secret, metadata };
        },
        "put": async ({ path, secret }) => {
            await axiosInstance.put<{ data: Secret }>(ctxPathJoin("data", path), {
                "data": secret
            });
        },
        "delete": async ({ path }) => {
            await axiosInstance.delete(ctxPathJoin("metadata", path));
        },
        "getToken": params => {
            const { doForceRefresh } = params ?? {};

            if (doForceRefresh) {
                clearCachedToken();
            }

            return getNewlyRequestedOrCachedToken();
        }
    };

    return secretsManager;
}
