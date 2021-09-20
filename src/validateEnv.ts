import { getEnv } from "env";
import { assert } from "tsafe/assert";

export function validateEnvs() {
    const env = getEnv();

    if (env.VAULT_URL !== "") {
        assert(env.VAULT_KV_ENGINE !== "");
        assert(env.VAULT_ROLE !== "");
    }

    if (env.OIDC_URL !== "") {
        assert(env.OIDC_CLIENT_ID !== "");
        assert(env.OIDC_REALM !== "");
        assert(env.OIDC_ONYXIA_USERNAME_CLAIM !== "");
    }
}
