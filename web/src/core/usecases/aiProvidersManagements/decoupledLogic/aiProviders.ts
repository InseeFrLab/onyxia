import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";
import type { LocalizedString } from "core/ports/OnyxiaApi/Language";
import type { AiModel } from "core/tools/fetchAiModels";
import type { PersistedAiConfig } from "./persistedAiConfig";

export type AiProvider = AiProvider.ConfiguredByAdmin | AiProvider.CreatedByUser;

export namespace AiProvider {
    export type Common = {
        /** Acts as the provider id, unique across all providers. */
        name: string;
        providerType: AiConfig.SupportedAiProviderType;
        apiBase: string;
        auth: Auth;
        models: Models;
        /**
         * What the user ticked in the models multi select. Always a subset of the
         * available models once they are loaded.
         */
        selectedModelIds: string[];
    };

    /** Provisioned by the instance configuration (the `AI` env). */
    export type ConfiguredByAdmin = Common & {
        origin: "configured by admin";
        description: LocalizedString | undefined;
        authentification: AiConfig.Provider["authentification"];
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

    export type Auth =
        /** The provider accepts unauthenticated calls. */
        | { stateDescription: "not required" }
        | { stateDescription: "not loaded" }
        | { stateDescription: "fetching" }
        /** The user has to bring an API key, or to log in, before we can call it. */
        | { stateDescription: "authentication required" }
        | { stateDescription: "error" }
        | { stateDescription: "authenticated"; apiKey: string };

    export type Models =
        | { stateDescription: "not loaded" }
        | { stateDescription: "fetching" }
        | { stateDescription: "error" }
        | { stateDescription: "loaded"; availableModels: AiModel[] };
}

/**
 * Everything about a provider that can only be known by talking to it: the API key
 * obtained by token exchange and the model list. This is the only part of the providers
 * that is held in the state, the rest is derived from the instance config and from the
 * user's persisted config.
 */
export type ProviderRuntime = {
    /** "not required" is a property of the config, it is derived and never stored. */
    auth: Exclude<AiProvider.Auth, { stateDescription: "not required" }>;
    models: AiProvider.Models;
};

export function createInitialProviderRuntime(): ProviderRuntime {
    return {
        auth: { stateDescription: "not loaded" },
        models: { stateDescription: "not loaded" }
    };
}

export function createAiProviders(params: {
    aiConfig: AiConfig;
    persistedAiConfig: PersistedAiConfig;
    runtimeByProviderName: Record<string, ProviderRuntime>;
}): AiProvider[] {
    const { aiConfig, persistedAiConfig, runtimeByProviderName } = params;

    const getRuntime = (providerName: string): ProviderRuntime =>
        runtimeByProviderName[providerName] ?? createInitialProviderRuntime();

    const getSelectedModelIds = (params: {
        providerName: string;
        models: AiProvider.Models;
    }): string[] => {
        const { providerName, models } = params;

        const selectedModelIds =
            persistedAiConfig.selectedModelIdsByProviderName[providerName] ?? [];

        // While the models are being fetched we have nothing to check the selection
        // against, dropping it then would silently clear what the user had ticked.
        if (models.stateDescription !== "loaded") {
            return selectedModelIds;
        }

        return selectedModelIds.filter(modelId =>
            models.availableModels.some(availableModel => availableModel.id === modelId)
        );
    };

    const aiProviders_configuredByAdmin = getConfiguredProviders({ aiConfig }).map(
        (provider_config): AiProvider.ConfiguredByAdmin => {
            const runtime = getRuntime(provider_config.name);

            // An explicit model list in the instance config means there is nothing to
            // fetch: the provider is already at its final state.
            const models: AiProvider.Models =
                provider_config.models === undefined
                    ? runtime.models
                    : {
                          stateDescription: "loaded",
                          availableModels: provider_config.models.map(modelId => ({
                              id: modelId,
                              name: modelId
                          }))
                      };

            return {
                origin: "configured by admin",
                name: provider_config.name,
                providerType: provider_config.providerType,
                apiBase: provider_config.apiBase,
                description: provider_config.description,
                authentification: provider_config.authentification,
                auth:
                    provider_config.authentification.type === "none"
                        ? { stateDescription: "not required" }
                        : runtime.auth,
                models,
                selectedModelIds: getSelectedModelIds({
                    providerName: provider_config.name,
                    models
                })
            };
        }
    );

    const providerNames_configuredByAdmin = new Set(
        aiProviders_configuredByAdmin.map(aiProvider => aiProvider.name)
    );

    const aiProviders_createdByUser = persistedAiConfig.customProviders.map(
        (customProvider): AiProvider.CreatedByUser => {
            const { models } = getRuntime(customProvider.name);

            const apiKey = persistedAiConfig.apiKeyByProviderName[customProvider.name];

            return {
                origin: "created by user",
                name: customProvider.name,
                providerType: customProvider.providerType,
                apiBase: customProvider.apiBase,
                isNameConflicting: providerNames_configuredByAdmin.has(
                    customProvider.name
                ),
                // A user created provider is authenticated by the key it was created
                // with, there is nothing asynchronous about it.
                auth:
                    apiKey === undefined || apiKey === ""
                        ? { stateDescription: "not required" }
                        : { stateDescription: "authenticated", apiKey },
                models,
                selectedModelIds: getSelectedModelIds({
                    providerName: customProvider.name,
                    models
                })
            };
        }
    );

    return [...aiProviders_configuredByAdmin, ...aiProviders_createdByUser];
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
