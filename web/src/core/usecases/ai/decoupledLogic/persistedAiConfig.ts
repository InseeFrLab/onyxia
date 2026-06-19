import { z } from "zod";
import { assert, is } from "tsafe";

// undefined isn't representable in JSON, so absent selections are stored as null.
export type PersistedModelSelection = {
    modelId: string | null;
};

export type PersistedCustomProvider = {
    id: string;
    label: string;
    apiBase: string;
    apiKey: string;
};

export type PersistedActiveProvider =
    | { kind: "none" }
    | { kind: "provider"; providerId: string };

/**
 * The whole AI configuration, serialized into the single `aiConfigStr` user config
 * entry (persisted in the secret manager — i.e. Vault). Only durable data lives here:
 * runtime-only fields (model catalog, OIDC token) are recomputed on init.
 */
export type PersistedAiConfig = {
    customProviders: PersistedCustomProvider[];
    /** Model selection per provider id (region providers included). */
    selections: Record<string, PersistedModelSelection>;
    activeProvider: PersistedActiveProvider;
};

const zPersistedAiConfig: z.ZodType<PersistedAiConfig> = z.object({
    customProviders: z.array(
        z.object({
            id: z.string(),
            label: z.string(),
            apiBase: z.string(),
            apiKey: z.string()
        })
    ),
    selections: z.record(
        z.string(),
        z.object({
            modelId: z.string().nullable()
        })
    ),
    activeProvider: z.union([
        z.object({ kind: z.literal("none") }),
        z.object({ kind: z.literal("provider"), providerId: z.string() })
    ])
});

/** Returns null when nothing usable is stored (never saved or corrupted). */
export function parseAiConfigStr(params: {
    aiConfigStr: string | null;
}): PersistedAiConfig | null {
    const { aiConfigStr } = params;

    if (aiConfigStr === null) {
        return null;
    }

    let aiConfig: unknown;

    try {
        aiConfig = JSON.parse(aiConfigStr);
    } catch {
        console.warn("Stored AI config is not valid JSON, ignoring it.");
        return null;
    }

    try {
        zPersistedAiConfig.parse(aiConfig);
    } catch {
        console.warn("Stored AI config does not match the expected shape, ignoring it.");
        return null;
    }

    assert(is<PersistedAiConfig>(aiConfig));

    return aiConfig;
}

export function serializeAiConfig(params: { aiConfig: PersistedAiConfig }): string {
    return JSON.stringify(params.aiConfig);
}
