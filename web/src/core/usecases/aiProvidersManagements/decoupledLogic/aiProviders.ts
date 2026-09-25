import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";
import type { AiModel } from "core/tools/fetchAiModels";
import type { PersistedAiConfig } from "./persistedAiConfig";

/** Omit applied to each member of a union, so that it stays discriminated. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type AiProvider = AiProvider.ConfiguredByAdmin | AiProvider.CreatedByUser;

export namespace AiProvider {
    export type Common = {
        /** Acts as the provider id, unique across all providers. */
        name: string;
        providerType: AiConfig.SupportedAiProviderType;
        apiBase: string;
        /**
         * What the user unticked in the models multi select. Every other model the
         * provider exposes is selected, including the ones it starts exposing later.
         */
        excludedModelIds: string[];
    };

    /** Provisioned by the instance configuration (the `AI` env). */
    export type ConfiguredByAdmin = Common & {
        origin: "configured by admin";
        documentation: AiConfig.Documentation | undefined;
        logoUrl: AiConfig.LogoUrl | undefined;
        authentification: AiConfig.Provider["authentification"];
        /** Model ids pinned by the instance configuration, when provided. */
        modelIds: string[] | undefined;
    };

    /** Added by the user from the account tab, stored in their user configs. */
    export type CreatedByUser = Common & {
        origin: "created by user";
        /**
         * True when the instance configuration was given the same name after the fact.
         * Such a provider is left visible so that the user can rename or delete it, but
         * it is kept out of the launch context where names must be unique.
         */
        isNameConflicting: boolean;
    };
}

/** Everything about a provider that can only be known by talking to it. */
export type AiProviderRuntime = {
    auth: AiProviderRuntime.Auth;
    models: AiProviderRuntime.Models;
};

export namespace AiProviderRuntime {
    export type Auth =
        | { stateDescription: "not required" }
        | { stateDescription: "not loaded" }
        | { stateDescription: "fetching" }
        /** The user has to provide an API key before we can call it. */
        | { stateDescription: "api-key not provided" }
        | { stateDescription: "error" }
        | { stateDescription: "authenticated"; apiKey: string };

    export type Models =
        | { stateDescription: "not loaded" }
        | { stateDescription: "fetching" }
        | { stateDescription: "error" }
        | { stateDescription: "loaded"; availableModels: AiModel[] };
}

/** The representation consumed by the UI and the launch context. */
export type AiProviderWithRuntime = DistributiveOmit<AiProvider, "excludedModelIds"> & {
    /**
     * The available models the user didn't exclude. Empty as long as the models
     * aren't known.
     */
    selectedModelIds: string[];
    auth: AiProviderRuntime.Auth;
    /** The models offered to the user: the ones pinned by the admin, if any. */
    models: AiProviderRuntime.Models;
    /**
     * The outcome of asking the provider for its models, even when the admin pinned
     * them: it tells whether the provider can be reached.
     */
    modelsListing: AiProviderRuntime.Models;
};

export function createInitialAiProviderRuntime(): AiProviderRuntime {
    return {
        auth: { stateDescription: "not loaded" },
        models: { stateDescription: "not loaded" }
    };
}

export function createAiProviders(params: {
    aiConfig: AiConfig;
    persistedAiConfig: PersistedAiConfig;
}): AiProvider[] {
    const { aiConfig, persistedAiConfig } = params;

    const aiProviders_configuredByAdmin = getConfiguredProviders({ aiConfig }).map(
        (provider_config): AiProvider.ConfiguredByAdmin => {
            return {
                origin: "configured by admin",
                name: provider_config.name,
                providerType: provider_config.providerType,
                apiBase: provider_config.apiBase,
                documentation: provider_config.documentation,
                logoUrl: provider_config.logoUrl,
                authentification: provider_config.authentification,
                modelIds: provider_config.models,
                excludedModelIds:
                    persistedAiConfig.excludedModelIdsByProviderName[
                        provider_config.name
                    ] ?? []
            };
        }
    );

    const providerNames_configuredByAdmin = new Set(
        aiProviders_configuredByAdmin.map(aiProvider => aiProvider.name)
    );

    const aiProviders_createdByUser = persistedAiConfig.customProviders.map(
        (customProvider): AiProvider.CreatedByUser => {
            return {
                origin: "created by user",
                name: customProvider.name,
                providerType: customProvider.providerType,
                apiBase: customProvider.apiBase,
                isNameConflicting: providerNames_configuredByAdmin.has(
                    customProvider.name
                ),
                excludedModelIds:
                    persistedAiConfig.excludedModelIdsByProviderName[
                        customProvider.name
                    ] ?? []
            };
        }
    );

    return [...aiProviders_configuredByAdmin, ...aiProviders_createdByUser];
}

/** Combines persisted provider definitions with their volatile execution state. */
export function createAiProvidersWithRuntime(params: {
    aiProviders: AiProvider[];
    runtimeByProviderName: Record<string, AiProviderRuntime>;
    persistedAiConfig: PersistedAiConfig;
}): AiProviderWithRuntime[] {
    const { aiProviders, runtimeByProviderName, persistedAiConfig } = params;

    return aiProviders.map(aiProvider => {
        const runtime =
            runtimeByProviderName[aiProvider.name] ?? createInitialAiProviderRuntime();
        // The models pinned by the admin are offered whether or not the provider can be
        // reached from the browser: the services may reach it when we can't.
        const models =
            aiProvider.origin === "configured by admin" &&
            aiProvider.modelIds !== undefined
                ? {
                      stateDescription: "loaded" as const,
                      availableModels: aiProvider.modelIds.map(id => ({ id }))
                  }
                : runtime.models;
        const auth = (() => {
            if (aiProvider.origin === "configured by admin") {
                return aiProvider.authentification.type === "none"
                    ? ({ stateDescription: "not required" } as const)
                    : runtime.auth;
            }

            const apiKey = persistedAiConfig.apiKeyByProviderName[aiProvider.name];
            return apiKey === undefined || apiKey === ""
                ? ({ stateDescription: "not required" } as const)
                : ({ stateDescription: "authenticated", apiKey } as const);
        })();

        const { excludedModelIds, ...rest } = aiProvider;

        return {
            ...rest,
            auth,
            models,
            modelsListing: runtime.models,
            selectedModelIds:
                models.stateDescription === "loaded"
                    ? getSelectedModelIds({
                          availableModels: models.availableModels,
                          excludedModelIds
                      })
                    : []
        };
    });
}

export function getSelectedModelIds(params: {
    availableModels: AiModel[];
    excludedModelIds: string[];
}): string[] {
    const { availableModels, excludedModelIds } = params;

    return availableModels
        .map(({ id }) => id)
        .filter(modelId => !excludedModelIds.includes(modelId));
}

/** Inverse of `getSelectedModelIds`, for the models listed by the provider. */
export function getExcludedModelIds(params: {
    availableModels: AiModel[];
    selectedModelIds: string[];
}): string[] {
    const { availableModels, selectedModelIds } = params;

    return availableModels
        .map(({ id }) => id)
        .filter(modelId => !selectedModelIds.includes(modelId));
}

/** The instance config accepts a single provider as well as an array of them. */
function getConfiguredProviders(params: { aiConfig: AiConfig }): AiConfig.Provider[] {
    const { aiConfig } = params;

    return Array.isArray(aiConfig.providers) ? aiConfig.providers : [aiConfig.providers];
}

/**
 * The default model is picked among the models the user ticked, so a selection change
 * can invalidate it. Rather than trying to keep the persisted value in sync on every
 * mutation, we validate it on read. When the user elected none, or when what they
 * elected is no longer selected, the first selected model stands in for it.
 */
export function getDefaultModel(params: {
    aiProviders: AiProviderWithRuntime[];
    defaultModel_persisted: PersistedAiConfig["defaultModel"];
}): { providerName: string; modelId: string } | undefined {
    const { aiProviders, defaultModel_persisted } = params;

    if (
        defaultModel_persisted !== null &&
        aiProviders.some(
            aiProvider =>
                aiProvider.name === defaultModel_persisted.providerName &&
                aiProvider.selectedModelIds.includes(defaultModel_persisted.modelId)
        )
    ) {
        return defaultModel_persisted;
    }

    const aiProvider_first = aiProviders.find(
        aiProvider => aiProvider.selectedModelIds.length !== 0
    );

    if (aiProvider_first === undefined) {
        return undefined;
    }

    return {
        providerName: aiProvider_first.name,
        modelId: aiProvider_first.selectedModelIds[0]
    };
}

/** `<providerName>/<modelId>`, the form the launch context and the UI selects use. */
export function stringifyModel(params: {
    providerName: string;
    modelId: string;
}): string {
    const { providerName, modelId } = params;

    return `${providerName}/${modelId}`;
}

/** Inverse of `stringifyModel`. */
export function parseModel(params: {
    model: string;
}): { providerName: string; modelId: string } | undefined {
    const { model } = params;

    // A provider name can't contain a "/" but a model id can, so the first one separates.
    const index = model.indexOf("/");

    if (index === -1) {
        return undefined;
    }

    const providerName = model.slice(0, index);
    const modelId = model.slice(index + 1);

    if (providerName === "" || modelId === "") {
        return undefined;
    }

    return { providerName, modelId };
}
