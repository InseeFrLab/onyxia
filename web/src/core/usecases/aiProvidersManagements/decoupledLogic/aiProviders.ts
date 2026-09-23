import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";
import type { AiModel } from "core/tools/fetchAiModels";
import type { PersistedAiConfig } from "./persistedAiConfig";

export type AiProvider = AiProvider.ConfiguredByAdmin | AiProvider.CreatedByUser;

export namespace AiProvider {
    export type Common = {
        /** Acts as the provider id, unique across all providers. */
        name: string;
        providerType: AiConfig.SupportedAiProviderType;
        apiBase: string;
        /**
         * What the user ticked in the models multi select. Always a subset of the
         * available models once the runtime has loaded them.
         */
        selectedModelIds: string[];
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
export type AiProviderWithRuntime = AiProvider & {
    auth: AiProviderRuntime.Auth;
    models: AiProviderRuntime.Models;
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
                selectedModelIds:
                    persistedAiConfig.selectedModelIdsByProviderName[
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
                selectedModelIds:
                    persistedAiConfig.selectedModelIdsByProviderName[
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

        return {
            ...aiProvider,
            auth,
            models,
            selectedModelIds:
                models.stateDescription !== "loaded"
                    ? aiProvider.selectedModelIds
                    : aiProvider.selectedModelIds.filter(modelId =>
                          models.availableModels.some(model => model.id === modelId)
                      )
        };
    });
}

/** The instance config accepts a single provider as well as an array of them. */
export function getConfiguredProviders(params: {
    aiConfig: AiConfig;
}): AiConfig.Provider[] {
    const { aiConfig } = params;

    return Array.isArray(aiConfig.providers) ? aiConfig.providers : [aiConfig.providers];
}

/**
 * The default model is picked among the models the user ticked, so a selection change
 * can invalidate it. Rather than trying to keep the persisted value in sync on every
 * mutation, we validate it on read.
 */
export function getDefaultModel(params: {
    aiProviders: AiProvider[];
    defaultModel_persisted: PersistedAiConfig["defaultModel"];
}): { providerName: string; modelId: string } | undefined {
    const { aiProviders, defaultModel_persisted } = params;

    if (defaultModel_persisted === null) {
        return undefined;
    }

    const aiProvider = aiProviders.find(
        aiProvider => aiProvider.name === defaultModel_persisted.providerName
    );

    if (aiProvider === undefined) {
        return undefined;
    }

    if (!aiProvider.selectedModelIds.includes(defaultModel_persisted.modelId)) {
        return undefined;
    }

    return defaultModel_persisted;
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
