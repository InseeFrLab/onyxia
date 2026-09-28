import { createSelector } from "clean-architecture";
import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import * as aiProvidersManagements from "core/usecases/aiProvidersManagements";
import {
    stringifyModel,
    getProviderConnectionState,
    providerTypeLogoUrl,
    type ProviderConnectionState
} from "core/usecases/aiProvidersManagements/decoupledLogic";
import { getRootContext } from "core/rootContext";

/** What the AI tab of the account page displays. */
export type AccountView = AccountView.NotReady | AccountView.Ready;

export declare namespace AccountView {
    export type NotReady = {
        isReady: false;
        /** "unreadable config": the stored config can't be read back, it can only be reset. */
        stateDescription: "loading" | "unreadable config" | "loading failed";
    };

    export type Ready = {
        isReady: true;
        /** The last save of the config failed, it can be retried. */
        hasSaveFailed: boolean;
        /** Markdown written by the admin in the instance configuration */
        description: LocalizedString | undefined;
        defaultModel: {
            /** `<providerName>/<modelId>` */
            value: string | undefined;
            /** Picked among what the user ticked, across all providers */
            optionGroups: {
                providerName: string;
                options: { value: string; modelId: string }[];
            }[];
        };
        providerCards: ProviderCard[];
    };

    export type ProviderCard = {
        name: string;
        origin: "configured by admin" | "created by user";
        /** undefined: nothing is displayed in place of the logo */
        logoUrl: AiConfig.LogoUrl | undefined;
        connectionState: ProviderConnectionState;
        models: {
            available: string[];
            selected: string[];
            isDisabled: boolean;
        };
    };
}

const main = createSelector(
    aiProvidersManagements.selectors.errorReason,
    aiProvidersManagements.selectors.aiProviders,
    aiProvidersManagements.selectors.defaultModel,
    aiProvidersManagements.selectors.configSaveState,
    (errorReason, aiProviders, defaultModel, configSaveState): AccountView => {
        if (aiProviders === undefined) {
            return {
                isReady: false,
                stateDescription: errorReason ?? "loading"
            };
        }

        const providerCards = aiProviders.map(
            (aiProvider): AccountView.ProviderCard => ({
                name: aiProvider.name,
                origin: aiProvider.origin,
                logoUrl:
                    aiProvider.origin === "created by user"
                        ? providerTypeLogoUrl[aiProvider.providerType]
                        : aiProvider.logoUrl,
                connectionState: getProviderConnectionState({
                    // Whether the provider could be reached, even if its models are pinned
                    connection:
                        aiProvider.auth.stateDescription === "error" ||
                        aiProvider.modelsListing.stateDescription === "error"
                            ? "failed"
                            : aiProvider.modelsListing.stateDescription === "loaded"
                              ? "succeeded"
                              : aiProvider.auth.stateDescription === "fetching" ||
                                  aiProvider.modelsListing.stateDescription === "fetching"
                                ? "testing"
                                : "not tested"
                }),
                models: {
                    available:
                        aiProvider.models.stateDescription === "loaded"
                            ? aiProvider.models.availableModels.map(({ id }) => id)
                            : [],
                    selected: aiProvider.selectedModelIds,
                    isDisabled:
                        aiProvider.models.stateDescription !== "loaded" ||
                        (aiProvider.origin === "created by user" &&
                            aiProvider.isNameConflicting)
                }
            })
        );

        return {
            isReady: true,
            hasSaveFailed: configSaveState === "error",
            description: getRootContext().aiConfig.description,
            defaultModel: {
                value:
                    defaultModel === undefined ? undefined : stringifyModel(defaultModel),
                optionGroups: aiProviders
                    .filter(aiProvider => aiProvider.selectedModelIds.length !== 0)
                    .map(aiProvider => ({
                        providerName: aiProvider.name,
                        options: aiProvider.selectedModelIds.map(modelId => ({
                            value: stringifyModel({
                                providerName: aiProvider.name,
                                modelId
                            }),
                            modelId
                        }))
                    }))
            },
            providerCards
        };
    }
);

export const selectors = { main };
