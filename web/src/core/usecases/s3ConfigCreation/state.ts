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
        action:
            | { type: "update existing config"; s3ConfigId: string }
            | { type: "create new config"; creationTime: number };
    };

    export namespace Ready {
        export type FormValues = {
            friendlyName: string;
            url: string;
            region: string | undefined;
            workingDirectoryPath: string;
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

export const name = "s3ConfigCreation";

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
                    s3ConfigIdToEdit: string | undefined;
                    initialFormValues: State.Ready["formValues"];
                };
            }
        ) => {
            const { s3ConfigIdToEdit, initialFormValues } = payload;

            return id<State.Ready>({
                stateDescription: "ready",
                formValues: initialFormValues,
                action:
                    s3ConfigIdToEdit === undefined
                        ? {
                              type: "create new config",
                              creationTime: Date.now()
                          }
                        : {
                              type: "update existing config",
                              s3ConfigId: s3ConfigIdToEdit
                          }
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
