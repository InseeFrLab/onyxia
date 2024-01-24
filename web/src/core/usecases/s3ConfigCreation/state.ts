import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import type { ConnectionTestStatus } from "core/usecases/s3ConfigManagement";

export type State = State.NotInitialized | State.Ready;

export namespace State {
    export type NotInitialized = {
        stateDescription: "not initialized";
    };

    export type Ready = {
        stateDescription: "ready";
        formValues: Ready.FormValues;
        connectionTestStatus: ConnectionTestStatus;
        /** Provided if editing */
        customConfigIndex: number | undefined;
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
                    customConfigIndex: number | undefined;
                    initialFormValues: State.Ready["formValues"];
                };
            }
        ) => {
            const { customConfigIndex, initialFormValues } = payload;

            return id<State.Ready>({
                customConfigIndex,
                "stateDescription": "ready",
                "formValues": initialFormValues,
                "connectionTestStatus": id<ConnectionTestStatus.NotTestedYet>({
                    "stateDescription": "not tested yet",
                    "isTestOngoing": false
                })
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

            state.connectionTestStatus = id<ConnectionTestStatus.NotTestedYet>({
                "stateDescription": "not tested yet",
                "isTestOngoing": false
            });
        },
        "connectionTestStarted": state => {
            assert(state.stateDescription === "ready");

            state.connectionTestStatus.isTestOngoing = true;
        },
        "connectionTestSucceeded": state => {
            assert(state.stateDescription === "ready");

            state.connectionTestStatus = id<ConnectionTestStatus.Success>({
                "stateDescription": "success",
                "isTestOngoing": false
            });
        },
        "connectionTestFailed": (
            state,
            { payload }: { payload: { errorMessage: string } }
        ) => {
            assert(state.stateDescription === "ready");

            state.connectionTestStatus = id<ConnectionTestStatus.Failed>({
                "stateDescription": "failed",
                "isTestOngoing": false,
                "errorMessage": payload.errorMessage
            });
        },
        "stateResetToNotInitialized": () =>
            id<State.NotInitialized>({
                "stateDescription": "not initialized"
            })
    }
});
