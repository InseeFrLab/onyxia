import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import type { AddUserProviderError } from "core/usecases/gitProvidersManagement";

export const name = "gitAccountUiController";

/**
 * What only the account tab needs to know about each provider card: the action in
 * progress and how the last one went. The connections themselves are in
 * `gitProvidersManagement`. No secret here: the token being typed stays in the input.
 */
export type State = {
    cardUiStateByProviderId: Record<string, CardUiState>;
    /** Where the user adds a provider of their own, gitlab.com for instance */
    addProviderDialog: AddProviderDialogState;
};

export type AddProviderDialogState = {
    isOpen: boolean;
    isSubmitting: boolean;
    /** How the last submission failed, cleared when the next one starts */
    error: AddProviderError | undefined;
};

/** save failed: the provider accepted the token, it couldn't be saved */
export type AddProviderError = AddUserProviderError | "save failed";

const initialAddProviderDialogState: AddProviderDialogState = {
    isOpen: false,
    isSubmitting: false,
    error: undefined
};

export type CardUiState = {
    pendingAction: PendingAction | undefined;
    /** How the last action failed, cleared when the next one starts */
    error: CardError | undefined;
    /** Signed out of a provider that can't revoke: the user is told where to do it */
    isRevocationHintShown: boolean;
    /** A PAT is saved, the user is typing the one to replace it with */
    isReplacingPersonalAccessToken: boolean;
};

export type PendingAction =
    | "sign in"
    | "sign out"
    | "set personal access token"
    | "remove personal access token"
    | "remove provider";

export type CardError =
    | { type: "popup blocked" }
    | { type: "sign in cancelled" }
    /** providerError: what the provider said, its error_description or error code */
    | { type: "sign in denied"; providerError: string | undefined }
    /** Forgejo: Onyxia was authorized before with other scopes, it must be revoked first */
    | { type: "grant scope conflict" }
    | { type: "sign in failed" }
    | { type: "sign out failed" }
    | { type: "personal access token rejected" }
    | { type: "personal access token check failed" }
    | { type: "remove failed" }
    | { type: "remove provider failed" };

export const initialCardUiState: CardUiState = {
    pendingAction: undefined,
    error: undefined,
    isRevocationHintShown: false,
    isReplacingPersonalAccessToken: false
};

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>({
        cardUiStateByProviderId: {},
        addProviderDialog: initialAddProviderDialogState
    }),
    reducers: {
        addProviderDialogOpened: state => {
            state.addProviderDialog = { ...initialAddProviderDialogState, isOpen: true };
        },
        addProviderDialogClosed: state => {
            state.addProviderDialog = initialAddProviderDialogState;
        },
        addProviderStarted: state => {
            state.addProviderDialog.isSubmitting = true;
            state.addProviderDialog.error = undefined;
        },
        addProviderFailed: (
            state,
            { payload }: { payload: { error: AddProviderError } }
        ) => {
            state.addProviderDialog.isSubmitting = false;
            state.addProviderDialog.error = payload.error;
        },
        actionStarted: (
            state,
            { payload }: { payload: { providerId: string; pendingAction: PendingAction } }
        ) => {
            const { providerId, pendingAction } = payload;

            const cardUiState = getOrCreateCardUiState({ state, providerId });

            cardUiState.pendingAction = pendingAction;
            cardUiState.error = undefined;
            cardUiState.isRevocationHintShown = false;
        },
        actionSucceeded: (
            state,
            {
                payload
            }: { payload: { providerId: string; isRevocationHintShown: boolean } }
        ) => {
            const { providerId, isRevocationHintShown } = payload;

            const cardUiState = getOrCreateCardUiState({ state, providerId });

            cardUiState.pendingAction = undefined;
            cardUiState.isRevocationHintShown = isRevocationHintShown;
            cardUiState.isReplacingPersonalAccessToken = false;
        },
        actionFailed: (
            state,
            { payload }: { payload: { providerId: string; error: CardError } }
        ) => {
            const { providerId, error } = payload;

            const cardUiState = getOrCreateCardUiState({ state, providerId });

            cardUiState.pendingAction = undefined;
            cardUiState.error = error;
        },
        replacingPersonalAccessTokenToggled: (
            state,
            {
                payload
            }: {
                payload: { providerId: string; isReplacingPersonalAccessToken: boolean };
            }
        ) => {
            const { providerId, isReplacingPersonalAccessToken } = payload;

            const cardUiState = getOrCreateCardUiState({ state, providerId });

            cardUiState.isReplacingPersonalAccessToken = isReplacingPersonalAccessToken;
            cardUiState.error = undefined;
        }
    }
});

function getOrCreateCardUiState(params: {
    state: State;
    providerId: string;
}): CardUiState {
    const { state, providerId } = params;

    return (state.cardUiStateByProviderId[providerId] ??= { ...initialCardUiState });
}
