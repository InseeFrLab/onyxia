import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import type {
    AddUserForgeError,
    UpdateUserForgeError
} from "core/usecases/gitForgesManagement";

export const name = "gitAccountUiController";

/**
 * What only the account tab needs to know about each forge card: the action in
 * progress and how the last one went. The connections themselves are in
 * `gitForgesManagement`. No secret here: the token being typed stays in the input.
 */
export type State = {
    cardUiStateByForgeId: Record<string, CardUiState>;
    /** Where the user adds a forge of their own, gitlab.com for instance */
    addForgeDialog: AddForgeDialogState;
    /** Where the user edits a forge, switching from one to another */
    manageForgeDialog: ManageForgeDialogState;
};

export type ManageForgeDialogState = {
    /** undefined: closed */
    forgeId: string | undefined;
    isSubmitting: boolean;
    /** How the last save failed, cleared when the next one starts or another forge is shown */
    error: ManageForgeError | undefined;
};

/** save failed: the forge accepted the token, it couldn't be saved */
export type ManageForgeError = UpdateUserForgeError | "save failed";

const initialManageForgeDialogState: ManageForgeDialogState = {
    forgeId: undefined,
    isSubmitting: false,
    error: undefined
};

export type AddForgeDialogState = {
    isOpen: boolean;
    isSubmitting: boolean;
    /** How the last submission failed, cleared when the next one starts */
    error: AddForgeError | undefined;
};

/** save failed: the forge accepted the token, it couldn't be saved */
export type AddForgeError = AddUserForgeError | "save failed";

const initialAddForgeDialogState: AddForgeDialogState = {
    isOpen: false,
    isSubmitting: false,
    error: undefined
};

export type CardUiState = {
    pendingAction: PendingAction | undefined;
    /** How the last action failed, cleared when the next one starts */
    error: CardError | undefined;
    /** Signed out of a forge that can't revoke: the user is told where to do it */
    isRevocationHintShown: boolean;
    /** The user is typing a PAT, the first one or the one to replace the saved one with */
    isEditingPersonalAccessToken: boolean;
};

export type PendingAction =
    | "sign in"
    | "sign out"
    | "set personal access token"
    | "remove personal access token"
    | "remove forge";

export type CardError =
    | { type: "popup blocked" }
    | { type: "sign in cancelled" }
    /** forgeError: what the forge said, its error_description or error code */
    | { type: "sign in denied"; forgeError: string | undefined }
    /** Forgejo: Onyxia was authorized before with other scopes, it must be revoked first */
    | { type: "grant scope conflict" }
    | { type: "sign in failed" }
    | { type: "sign out failed" }
    | { type: "personal access token rejected" }
    | { type: "personal access token check failed" }
    | { type: "remove failed" }
    | { type: "remove forge failed" };

export const initialCardUiState: CardUiState = {
    pendingAction: undefined,
    error: undefined,
    isRevocationHintShown: false,
    isEditingPersonalAccessToken: false
};

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>({
        cardUiStateByForgeId: {},
        addForgeDialog: initialAddForgeDialogState,
        manageForgeDialog: initialManageForgeDialogState
    }),
    reducers: {
        manageForgeDialogOpened: (
            state,
            { payload }: { payload: { forgeId: string } }
        ) => {
            state.manageForgeDialog = {
                ...initialManageForgeDialogState,
                forgeId: payload.forgeId
            };
        },
        manageForgeDialogClosed: state => {
            state.manageForgeDialog = initialManageForgeDialogState;
        },
        manageForgeStarted: state => {
            state.manageForgeDialog.isSubmitting = true;
            state.manageForgeDialog.error = undefined;
        },
        manageForgeFailed: (
            state,
            { payload }: { payload: { error: ManageForgeError } }
        ) => {
            state.manageForgeDialog.isSubmitting = false;
            state.manageForgeDialog.error = payload.error;
        },
        addForgeDialogOpened: state => {
            state.addForgeDialog = { ...initialAddForgeDialogState, isOpen: true };
        },
        addForgeDialogClosed: state => {
            state.addForgeDialog = initialAddForgeDialogState;
        },
        addForgeStarted: state => {
            state.addForgeDialog.isSubmitting = true;
            state.addForgeDialog.error = undefined;
        },
        addForgeFailed: (state, { payload }: { payload: { error: AddForgeError } }) => {
            state.addForgeDialog.isSubmitting = false;
            state.addForgeDialog.error = payload.error;
        },
        actionStarted: (
            state,
            { payload }: { payload: { forgeId: string; pendingAction: PendingAction } }
        ) => {
            const { forgeId, pendingAction } = payload;

            const cardUiState = getOrCreateCardUiState({ state, forgeId });

            cardUiState.pendingAction = pendingAction;
            cardUiState.error = undefined;
            cardUiState.isRevocationHintShown = false;
        },
        actionSucceeded: (
            state,
            { payload }: { payload: { forgeId: string; isRevocationHintShown: boolean } }
        ) => {
            const { forgeId, isRevocationHintShown } = payload;

            const cardUiState = getOrCreateCardUiState({ state, forgeId });

            cardUiState.pendingAction = undefined;
            cardUiState.isRevocationHintShown = isRevocationHintShown;
            cardUiState.isEditingPersonalAccessToken = false;
        },
        actionFailed: (
            state,
            { payload }: { payload: { forgeId: string; error: CardError } }
        ) => {
            const { forgeId, error } = payload;

            const cardUiState = getOrCreateCardUiState({ state, forgeId });

            cardUiState.pendingAction = undefined;
            cardUiState.error = error;
        },
        editingPersonalAccessTokenToggled: (
            state,
            {
                payload
            }: {
                payload: { forgeId: string; isEditingPersonalAccessToken: boolean };
            }
        ) => {
            const { forgeId, isEditingPersonalAccessToken } = payload;

            const cardUiState = getOrCreateCardUiState({ state, forgeId });

            cardUiState.isEditingPersonalAccessToken = isEditingPersonalAccessToken;
            cardUiState.error = undefined;
        }
    }
});

function getOrCreateCardUiState(params: { state: State; forgeId: string }): CardUiState {
    const { state, forgeId } = params;

    return (state.cardUiStateByForgeId[forgeId] ??= { ...initialCardUiState });
}
