import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
import { stringifyModel, type AiProvider } from "./aiProviders";

export const emptyAiContext: XOnyxiaContext["ai"] = {
    enabled: false,
    models: [],
    defaultModel: undefined,
    providers: []
};

/** Maps the providers onto the shape the launch context (`.ai`) is contracted to have. */
export function createAiContext(params: {
    aiProviders: AiProvider[];
    defaultModel: { providerName: string; modelId: string } | undefined;
}): XOnyxiaContext["ai"] {
    const { aiProviders, defaultModel } = params;

    // Only the providers we can actually call, and that the user ticked at least one
    // model on, are worth injecting.
    const aiProviders_usable = aiProviders.filter(aiProvider => {
        if (aiProvider.origin === "created by user" && aiProvider.isNameConflicting) {
            return false;
        }

        if (aiProvider.selectedModelIds.length === 0) {
            return false;
        }

        switch (aiProvider.auth.stateDescription) {
            case "not required":
            case "authenticated":
                return true;
            default:
                return false;
        }
    });

    const models = aiProviders_usable
        .map(aiProvider =>
            aiProvider.selectedModelIds.map(modelId =>
                stringifyModel({ providerName: aiProvider.name, modelId })
            )
        )
        .flat();

    const defaultModel_str =
        defaultModel === undefined ? undefined : stringifyModel(defaultModel);

    return {
        enabled: models.length > 0,
        models,
        defaultModel:
            defaultModel_str !== undefined && models.includes(defaultModel_str)
                ? defaultModel_str
                : undefined,
        providers: aiProviders_usable.map(aiProvider => ({
            name: aiProvider.name,
            apiBase: aiProvider.apiBase,
            apiKey:
                aiProvider.auth.stateDescription === "authenticated"
                    ? aiProvider.auth.apiKey
                    : undefined,
            models: aiProvider.selectedModelIds,
            type: aiProvider.providerType
        }))
    };
}
