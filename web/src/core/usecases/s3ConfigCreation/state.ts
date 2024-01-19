import { createUsecaseActions } from "redux-clean-architecture";
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
        connectionTestStatus: Ready.ConnectionTestStatus;
    };

    export namespace Ready {
        export type FormValues = {
            url: string;
            region: string;
            workingDirectoryPath: string;
            pathStyleAccess: boolean;
            accountFriendlyName: string;
            accessKeyId: string;
            secretAccessKey: string;
            sessionToken: string | undefined;
        };
    }

    export namespace Ready {
        export type ConnectionTestStatus =
            | ConnectionTestStatus.NotTestedYet
            | ConnectionTestStatus.Valid
            | ConnectionTestStatus.Invalid;

        export namespace ConnectionTestStatus {
            type Common = {
                itTestOngoing: boolean;
            };

            export type NotTestedYet = Common & {
                stateDescription: "not tested yet";
            };

            export type Valid = Common & {
                stateDescription: "valid";
            };

            export type Invalid = Common & {
                stateDescription: "invalid";
                errorMessage: string;
            };
        }
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
    "initialState": id<State>(
        id<State.NotInitialized>({
            "stateDescription": "not initialized"
        })
    ),
    "reducers": {
        "initialized": (
            _state,
            {
                payload
            }: {
                payload: {
                    initialFormValues: State.Ready["formValues"];
                };
            }
        ) => {
            const { initialFormValues } = payload;

            return id<State.Ready>({
                "stateDescription": "ready",
                "formValues": initialFormValues,
                "connectionTestStatus": id<State.Ready.ConnectionTestStatus.NotTestedYet>(
                    {
                        "stateDescription": "not tested yet",
                        "itTestOngoing": false
                    }
                )
            });
        },
        "formValueChanged": (
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

            state.connectionTestStatus =
                id<State.Ready.ConnectionTestStatus.NotTestedYet>({
                    "stateDescription": "not tested yet",
                    "itTestOngoing": false
                });
        },
        "connectionTestStarted": state => {
            assert(state.stateDescription === "ready");

            state.connectionTestStatus.itTestOngoing = true;
        },
        "connectionTestSucceeded": state => {
            assert(state.stateDescription === "ready");

            state.connectionTestStatus = id<State.Ready.ConnectionTestStatus.Valid>({
                "stateDescription": "valid",
                "itTestOngoing": false
            });
        },
        "connectionTestFailed": (
            state,
            { payload }: { payload: { errorMessage: string } }
        ) => {
            assert(state.stateDescription === "ready");

            state.connectionTestStatus = id<State.Ready.ConnectionTestStatus.Invalid>({
                "stateDescription": "invalid",
                "itTestOngoing": false,
                "errorMessage": payload.errorMessage
            });
        },
        "stateResetToNotInitialized": () =>
            id<State.NotInitialized>({
                "stateDescription": "not initialized"
            })
    }
});
