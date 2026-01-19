import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";

export type State = State.NotInitialized | State.Ready;

export namespace State {
    export type NotInitialized = {
        stateDescription: "not initialized";
    };

    export type Ready = {
        stateDescription: "ready";
        formValues: Ready.FormValues;
        creationTimeOfProfileToEdit: number | undefined;
    };

    export namespace Ready {
        export type FormValues = {
            profileName: string;
            url: string;
            region: string | undefined;
            pathStyleAccess: boolean;
            isAnonymous: boolean;
            accessKeyId: string | undefined;
            secretAccessKey: string | undefined;
            sessionToken: string | undefined;
        };
    }
}

export type ChangeValueParams<
    K extends keyof State.Ready.FormValues = keyof State.Ready.FormValues
> = {
    key: K;
    value: State.Ready.FormValues[K];
};

export const name = "s3ProfilesCreationUiController";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>(
        id<State.NotInitialized>({
            stateDescription: "not initialized"
        })
    ),
    reducers: {
        initialized: (
            _state,
            {
                payload
            }: {
                payload: {
                    creationTimeOfProfileToEdit: number | undefined;
                    initialFormValues: State.Ready["formValues"];
                };
            }
        ) => {
            const { creationTimeOfProfileToEdit, initialFormValues } = payload;

            return id<State.Ready>({
                stateDescription: "ready",
                formValues: initialFormValues,
                creationTimeOfProfileToEdit
            });
        },
        formValueChanged: (
            state,
            {
                payload
            }: {
                payload: ChangeValueParams;
            }
        ) => {
            assert(state.stateDescription === "ready");

            if (state.formValues[payload.key] === payload.value) {
                return;
            }

            Object.assign(state.formValues, { [payload.key]: payload.value });
        },
        stateResetToNotInitialized: () =>
            id<State.NotInitialized>({
                stateDescription: "not initialized"
            })
    }
});
