import { z } from "zod";
import { assert, type Equals, id } from "tsafe";
import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";
import { supportedAiProviderTypes } from "./supportedAiProviderTypes";

/**
 * The user's own AI configuration, serialized into the single `aiConfigStr` user config
 * entry (persisted in the secret manager).
 *
 *
 * Providers are keyed by name, names are unique across admin configured providers and
 * user created ones alike.
 */
export type PersistedAiConfig = {
    customProviders: PersistedAiConfig.CustomProvider[];
    /**
     * API keys typed in by the user. Holds the keys of the user created providers as
     * well as the keys of the admin configured providers that expect the user to bring
     * their own.
     */
    apiKeyByProviderName: Record<string, string>;
    /** Model ids ticked by the user in the multi select of each provider. */
    selectedModelIdsByProviderName: Record<string, string[]>;
    /** null, and not undefined, so that it round trips through JSON. */
    defaultModel: { providerName: string; modelId: string } | null;
};

export namespace PersistedAiConfig {
    export type CustomProvider = {
        name: string;
        providerType: AiConfig.SupportedAiProviderType;
        apiBase: string;
    };
}

const zPersistedAiConfig = (() => {
    type TargetType = PersistedAiConfig;

    const zTargetType = z.object({
        customProviders: z.array(
            z.object({
                name: z.string().min(1),
                providerType: z.enum(supportedAiProviderTypes),
                apiBase: z.string().min(1)
            })
        ),
        apiKeyByProviderName: z.record(z.string(), z.string()),
        selectedModelIdsByProviderName: z.record(z.string(), z.array(z.string())),
        defaultModel: z
            .object({ providerName: z.string(), modelId: z.string() })
            .nullable()
    });

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();

export function createEmptyPersistedAiConfig(): PersistedAiConfig {
    return {
        customProviders: [],
        apiKeyByProviderName: {},
        selectedModelIdsByProviderName: {},
        defaultModel: null
    };
}

/**
 * Returns undefined when there is nothing usable to restore, either because the user
 * never saved anything or because what is stored can't be read back. The caller is
 * expected to tell the user about the latter instead of silently starting over.
 */
export function parseAiConfigStr(params: {
    aiConfigStr: string | null;
}): PersistedAiConfig | undefined {
    const { aiConfigStr } = params;

    if (aiConfigStr === null) {
        return undefined;
    }

    let parsedValue: unknown;

    try {
        parsedValue = JSON.parse(aiConfigStr);
    } catch {
        return undefined;
    }

    // A config we can't read back is a recoverable condition, not an exception: the tab
    // must still open, so we don't let the ZodError escape.
    const result = zPersistedAiConfig.safeParse(parsedValue);

    if (!result.success) {
        return undefined;
    }

    return result.data;
}

export function serializeAiConfig(params: { aiConfig: PersistedAiConfig }): string {
    const { aiConfig } = params;

    return JSON.stringify(aiConfig);
}

/**
 * Providers are keyed by name, so renaming one means moving every entry that refers to
 * it. Kept here, as a single pure function, so that the thunks never have to reach into
 * the shape of the persisted config.
 */
export function renameProviderInPersistedAiConfig(params: {
    aiConfig: PersistedAiConfig;
    providerName_current: string;
    providerName_new: string;
}): PersistedAiConfig {
    const { aiConfig, providerName_current, providerName_new } = params;

    if (providerName_current === providerName_new) {
        return aiConfig;
    }

    const renameKey = <T>(record: Record<string, T>): Record<string, T> => {
        const { [providerName_current]: value, ...rest } = record;

        return value === undefined ? rest : { ...rest, [providerName_new]: value };
    };

    return {
        customProviders: aiConfig.customProviders.map(customProvider =>
            customProvider.name === providerName_current
                ? { ...customProvider, name: providerName_new }
                : customProvider
        ),
        apiKeyByProviderName: renameKey(aiConfig.apiKeyByProviderName),
        selectedModelIdsByProviderName: renameKey(
            aiConfig.selectedModelIdsByProviderName
        ),
        defaultModel:
            aiConfig.defaultModel?.providerName === providerName_current
                ? { ...aiConfig.defaultModel, providerName: providerName_new }
                : aiConfig.defaultModel
    };
}

/** Symmetrical to the rename: dropping a provider must not leave orphan entries. */
export function removeProviderFromPersistedAiConfig(params: {
    aiConfig: PersistedAiConfig;
    providerName: string;
}): PersistedAiConfig {
    const { aiConfig, providerName } = params;

    const removeKey = <T>(record: Record<string, T>): Record<string, T> => {
        const { [providerName]: _removed, ...rest } = record;

        return rest;
    };

    return {
        customProviders: aiConfig.customProviders.filter(
            customProvider => customProvider.name !== providerName
        ),
        apiKeyByProviderName: removeKey(aiConfig.apiKeyByProviderName),
        selectedModelIdsByProviderName: removeKey(
            aiConfig.selectedModelIdsByProviderName
        ),
        defaultModel:
            aiConfig.defaultModel?.providerName === providerName
                ? null
                : aiConfig.defaultModel
    };
}
