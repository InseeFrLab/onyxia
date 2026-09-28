import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";
import * as aiProvidersManagements from "core/usecases/aiProvidersManagements";
import {
    supportedAiProviderTypes,
    getSelectedModelIds,
    getProviderConnectionState,
    type ProviderConnectionState
} from "core/usecases/aiProvidersManagements/decoupledLogic";
import { name, type State } from "./state";

const state = (rootState: RootState) => rootState[name];

/** Shared by the thunks and the selectors of the dialogs */
const form = createSelector(
    state,
    aiProvidersManagements.selectors.aiProviders,
    aiProvidersManagements.protectedSelectors.persistedAiConfig,
    (state, aiProviders, persistedAiConfig) => {
        if (state.stateDescription === "closed") {
            return { isOpen: false as const };
        }

        const { formValues, providerName_current, providerOrigin } = state;

        const isConfiguredByAdmin = providerOrigin === "configured by admin";

        const aiProvider_current =
            providerName_current === undefined
                ? undefined
                : aiProviders?.find(
                      aiProvider => aiProvider.name === providerName_current
                  );

        const canEditApiKey =
            !isConfiguredByAdmin ||
            (aiProvider_current?.origin === "configured by admin" &&
                aiProvider_current.authentification.type === "api-key" &&
                aiProvider_current.authentification.obtentionMethod === "user-provided");

        const providerName = formValues.name.trim();

        // What the admin configured isn't editable, hence always valid
        const isNameValid = isConfiguredByAdmin
            ? true
            : providerName !== "" &&
              !providerName.includes("/") &&
              // The name is the provider's id, it has to stay unique.
              !(aiProviders ?? []).some(
                  aiProvider =>
                      aiProvider.name === providerName &&
                      aiProvider.name !== providerName_current
              );

        const isApiBaseValid = (() => {
            if (isConfiguredByAdmin) {
                return true;
            }

            let url: URL;

            try {
                url = new URL(formValues.apiBase.trim());
            } catch {
                return false;
            }

            return url.protocol === "http:" || url.protocol === "https:";
        })();

        // Normalized the way they are when saved
        const isConnectionSaved =
            aiProvider_current !== undefined &&
            formValues.providerType === aiProvider_current.providerType &&
            formValues.apiBase.trim().replace(/\/+$/, "") ===
                aiProvider_current.apiBase &&
            formValues.apiKey.trim() ===
                (persistedAiConfig.apiKeyByProviderName[aiProvider_current.name] ?? "");

        /**
         * The models the user can pick from: the ones listed by the last successful
         * test, or else the ones pinned by the admin, which are offered anyway.
         */
        const availableModels =
            state.connectionTest.stateDescription === "succeeded"
                ? state.connectionTest.availableModels
                : aiProvider_current?.origin === "configured by admin" &&
                    aiProvider_current.modelIds !== undefined
                  ? aiProvider_current.modelIds.map(id => ({ id }))
                  : undefined;

        /**
         * When the listed models are the ones of the saved configuration, picking some is
         * saved right away, like from the provider card. Otherwise the selection depends
         * on unsaved values and is saved along with them.
         */
        const selectedModelIds_draft =
            availableModels === undefined
                ? []
                : getSelectedModelIds({
                      availableModels,
                      excludedModelIds: state.excludedModelIds_draft
                  });

        const isModelSelectionSavedImmediately =
            isConnectionSaved &&
            aiProvider_current !== undefined &&
            aiProvider_current.models.stateDescription === "loaded" &&
            availableModels !== undefined;

        const hasChanges = (() => {
            // Nothing is saved yet, there is nothing to compare with
            if (aiProvider_current === undefined) {
                return true;
            }

            if (
                selectedModelIds_draft.length !==
                    aiProvider_current.selectedModelIds.length ||
                aiProvider_current.selectedModelIds.some(
                    modelId => !selectedModelIds_draft.includes(modelId)
                )
            ) {
                return true;
            }

            // A successful test lists models we didn't have: saving makes them usable
            if (
                state.connectionTest.stateDescription === "succeeded" &&
                aiProvider_current.models.stateDescription !== "loaded"
            ) {
                return true;
            }

            return (
                formValues.name.trim() !== aiProvider_current.name || !isConnectionSaved
            );
        })();

        /** The same as on the card, but for what is on screen, saved or not */
        const connectionState = getProviderConnectionState({
            connection: state.connectionTest.stateDescription
        });

        /** Only for the OIDC token exchange authentication */
        const isRefreshingCredentials =
            aiProvider_current?.auth.stateDescription === "fetching";

        const canTestConnection =
            formValues.providerType !== undefined &&
            !isRefreshingCredentials &&
            isApiBaseValid &&
            !state.isSubmitting &&
            state.connectionTest.stateDescription !== "testing";

        return {
            isOpen: true as const,
            aiProvider_current,
            providerName_current,
            providerOrigin,
            isEditing: providerName_current !== undefined,
            canEditApiKey,
            formValues,
            connectionTest: state.connectionTest,
            selectedModelIds_draft,
            isSubmitting: state.isSubmitting,
            hasSubmissionFailed: state.hasSubmissionFailed,
            isNameValid,
            isApiBaseValid,
            canTestConnection,
            hasChanges,
            connectionState,
            availableModels,
            isModelSelectionSavedImmediately,
            isRefreshingCredentials,
            canSubmit:
                hasChanges &&
                !isRefreshingCredentials &&
                isNameValid &&
                formValues.providerType !== undefined &&
                isApiBaseValid &&
                !state.isSubmitting &&
                state.connectionTest.stateDescription !== "testing"
        };
    }
);

export const privateSelectors = { form };

/** What `CustomProviderFormDialog` displays: a provider being created. */
export type CreateDialogView = CreateDialogView.Closed | CreateDialogView.Open;

export declare namespace CreateDialogView {
    export type Closed = { isOpen: false };

    export type Open = {
        isOpen: true;
        name: { value: string; isInvalid: boolean };
        providerType: ProviderTypeField;
        apiBase: { value: string; isInvalid: boolean };
        apiKey: { value: string };
        connectionTest: {
            state: State.ConnectionTest["stateDescription"];
            canTest: boolean;
        };
        models: ModelsField;
        hasSaveFailed: boolean;
        isSaving: boolean;
        canSave: boolean;
    };
}

/** What `ManageProvidersDialog` displays: a provider that already exists. */
export type ManageDialogView = ManageDialogView.Closed | ManageDialogView.Open;

export declare namespace ManageDialogView {
    export type Closed = { isOpen: false };

    export type Open = {
        isOpen: true;
        /** The saved name, the one to pick in the providers select */
        providerName: string;
        providerNames: string[];
        origin: "configured by admin" | "created by user";
        connectionState: ProviderConnectionState;
        /** Only for the providers created by the user, which can be redefined */
        configuration:
            | {
                  name: { value: string; isInvalid: boolean };
                  providerType: ProviderTypeField;
              }
            | undefined;
        apiBase: { value: string; isEditable: boolean; isInvalid: boolean };
        /** undefined when there is no key to show nor to type in */
        apiKey: { value: string; isEditable: boolean } | undefined;
        /** The one thing that prevents the provider from working, if any */
        alert: ManageDialogView.Alert | undefined;
        connectionTest: { isTesting: boolean; canTest: boolean };
        /** Only for the OIDC token exchange authentication */
        credentialsRefresh: { isRefreshing: boolean } | undefined;
        models: ModelsField;
        canSave: boolean;
        canDelete: boolean;
        /** Written by the admin in the instance configuration */
        documentation: AiConfig.Documentation | undefined;
    };

    export type Alert = "save failed" | "connection failed" | "api-key not provided";
}

export type ProviderTypeField = {
    value: AiConfig.SupportedAiProviderType | undefined;
    options: readonly AiConfig.SupportedAiProviderType[];
};

export type ModelsField = {
    available: string[];
    selected: string[];
    isDisabled: boolean;
};

const createDialog = createSelector(form, (form): CreateDialogView => {
    if (!form.isOpen || form.isEditing) {
        return { isOpen: false };
    }

    const { formValues, connectionTest } = form;

    return {
        isOpen: true,
        name: {
            value: formValues.name,
            // Nothing to blame the user for as long as they haven't typed anything
            isInvalid: !form.isNameValid && formValues.name !== ""
        },
        providerType: {
            value: formValues.providerType,
            options: supportedAiProviderTypes
        },
        apiBase: {
            value: formValues.apiBase,
            isInvalid: !form.isApiBaseValid && formValues.apiBase !== ""
        },
        apiKey: { value: formValues.apiKey },
        connectionTest: {
            state: connectionTest.stateDescription,
            canTest: form.canTestConnection
        },
        models: {
            available: form.availableModels?.map(({ id }) => id) ?? [],
            selected: form.selectedModelIds_draft,
            isDisabled: connectionTest.stateDescription !== "succeeded"
        },
        hasSaveFailed: form.hasSubmissionFailed,
        isSaving: form.isSubmitting,
        canSave: form.canSubmit
    };
});

const manageDialog = createSelector(
    form,
    aiProvidersManagements.selectors.aiProviders,
    (form, aiProviders): ManageDialogView => {
        if (!form.isOpen || !form.isEditing) {
            return { isOpen: false };
        }

        const { aiProvider_current: aiProvider, formValues, connectionTest } = form;

        // The provider may have just been deleted
        if (aiProvider === undefined) {
            return { isOpen: false };
        }

        const isCreatedByUser = aiProvider.origin === "created by user";

        const alert = ((): ManageDialogView.Alert | undefined => {
            if (form.hasSubmissionFailed) {
                return "save failed";
            }

            // The test describes what is on screen, it prevails over the state of the
            // saved configuration.
            switch (connectionTest.stateDescription) {
                case "failed":
                    return "connection failed";
                case "testing":
                case "succeeded":
                    return undefined;
                case "not tested":
                    break;
            }

            if (
                aiProvider.auth.stateDescription === "api-key not provided" &&
                formValues.apiKey.trim() === ""
            ) {
                return "api-key not provided";
            }

            return undefined;
        })();

        return {
            isOpen: true,
            providerName: aiProvider.name,
            providerNames: (aiProviders ?? []).map(({ name }) => name),
            origin: aiProvider.origin,
            connectionState: form.connectionState,
            configuration: isCreatedByUser
                ? {
                      name: {
                          value: formValues.name,
                          isInvalid: !form.isNameValid && formValues.name !== ""
                      },
                      providerType: {
                          value: formValues.providerType,
                          options: supportedAiProviderTypes
                      }
                  }
                : undefined,
            apiBase: {
                value: formValues.apiBase,
                isEditable: isCreatedByUser,
                isInvalid: !form.isApiBaseValid && formValues.apiBase !== ""
            },
            apiKey: form.canEditApiKey
                ? { value: formValues.apiKey, isEditable: true }
                : aiProvider.auth.stateDescription === "authenticated"
                  ? { value: aiProvider.auth.apiKey, isEditable: false }
                  : undefined,
            alert,
            connectionTest: {
                isTesting: connectionTest.stateDescription === "testing",
                canTest: form.canTestConnection
            },
            credentialsRefresh:
                aiProvider.origin === "configured by admin" &&
                aiProvider.authentification.type === "api-key" &&
                aiProvider.authentification.obtentionMethod ===
                    "open-webui-oidc-token-exchange"
                    ? { isRefreshing: form.isRefreshingCredentials }
                    : undefined,
            models: {
                available: form.availableModels?.map(({ id }) => id) ?? [],
                selected: form.selectedModelIds_draft,
                isDisabled:
                    form.isSubmitting ||
                    form.isRefreshingCredentials ||
                    (aiProvider.origin === "created by user" &&
                        aiProvider.isNameConflicting)
            },
            canSave: form.canSubmit,
            canDelete: isCreatedByUser && !form.isSubmitting,
            documentation:
                aiProvider.origin === "configured by admin"
                    ? aiProvider.documentation
                    : undefined
        };
    }
);

export const selectors = { createDialog, manageDialog };
