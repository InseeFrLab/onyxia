import { getEnv } from "env";
import { assert } from "tsafe/assert";

export function validateEnvs() {
    const env = getEnv();

    if (env.OIDC_URL !== "") {
        assert(env.OIDC_REALM !== "");
    }
}
