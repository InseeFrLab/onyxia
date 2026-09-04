import { z } from "zod";

// undefined isn't representable in JSON, so absent selections are stored as null.
export type PersistedModelSelection = string | null;

export type PersistedCustomProvider = {
    id: string;
    name: string;
    provider: string;
    apiBase: string;
    apiKey: string;
};

/**
 * The whole AI configuration, serialized into the single `aiConfigStr` user config
 * entry (persisted in the secret manager — i.e. Vault). Only durable data lives here:
 * runtime-only fields (model list, OIDC token) are recomputed on init.
 */
export type PersistedAiConfig = {
    customProviders: PersistedCustomProvider[];
    /** Model selection per provider id (managed providers included). */
    selections: Record<string, PersistedModelSelection>;
    // null (not undefined) because absent selections must round-trip through JSON.
    activeProviderId: string | null;
};

const zPersistedModelSelection = z
    .union([z.string().nullable(), z.object({ modelId: z.string().nullable() })])
    .transform(selection =>
        typeof selection === "object" && selection !== null
            ? selection.modelId
            : selection
    );

const zPersistedAiConfig = z.object({
    customProviders: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            provider: z.string(),
            apiBase: z.string(),
            apiKey: z.string()
        })
    ),
    selections: z.record(z.string(), zPersistedModelSelection),
    activeProviderId: z.string().nullable()
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
        return zPersistedAiConfig.parse(aiConfig);
    } catch {
        console.warn("Stored AI config does not match the expected shape, ignoring it.");
        return null;
    }
}

export function serializeAiConfig(params: { aiConfig: PersistedAiConfig }): string {
    return JSON.stringify(params.aiConfig);
}
