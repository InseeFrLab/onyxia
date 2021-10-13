import { getEnv } from "env";
import { assert } from "tsafe/assert";
import { paletteIds } from "app/theme/PaletteId";
import { id } from "tsafe/id";

export function validateEnvs() {
    const env = getEnv();

    if (env.VAULT_URL !== "") {
        assert(env.VAULT_KV_ENGINE !== "");
        assert(env.VAULT_ROLE !== "");
    }

    if (env.OIDC_URL !== "") {
        assert(env.OIDC_REALM !== "");
    }

    assert(
        id<readonly string[]>(paletteIds).includes(env.THEME),
        `${env.THEME} is not a valid theme. Available themes are: ${paletteIds}`,
    );
}
