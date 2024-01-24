import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "clean-architecture";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";

type State = {
    connectionTestStatuses: ConnectionTestStatus[];
};

export type ConnectionTestStatus =
    | ConnectionTestStatus.NotTestedYet
    | ConnectionTestStatus.Success
    | ConnectionTestStatus.Failed;

export namespace ConnectionTestStatus {
    type Common = {
        isTestOngoing: boolean;
    };

    export type NotTestedYet = Common & {
        stateDescription: "not tested yet";
    };

    export type Success = Common & {
        stateDescription: "success";
    };

    export type Failed = Common & {
        stateDescription: "failed";
        errorMessage: string;
    };
}

export const name = "s3ConfigManagement";

export const { actions, reducer } = createUsecaseActions({
    name,
    "initialState": createObjectThatThrowsIfAccessed<State>(),
    "reducers": {
        "initialized": (
            _,
            {
                payload
            }: {
                payload: {
                    customConfigCount: number;
                };
            }
        ) => {
            const { customConfigCount } = payload;

            return {
                "connectionTestStatuses": new Array(customConfigCount).fill(
                    id<ConnectionTestStatus.NotTestedYet>({
                        "isTestOngoing": false,
                        "stateDescription": "not tested yet"
                    })
                )
            };
        },
        "customConfigAdded": (
            state,
            {
                payload
            }: {
                payload: {
                    connectionTestStatus: ConnectionTestStatus;
                };
            }
        ) => {
            const { connectionTestStatus } = payload;

            state.connectionTestStatuses.push(connectionTestStatus);
        },
        "customConfigUpdated": (
            state,
            {
                payload
            }: {
                payload: {
                    customConfigIndex: number;
                    connectionTestStatus: ConnectionTestStatus;
                };
            }
        ) => {
            const { customConfigIndex, connectionTestStatus } = payload;

            state.connectionTestStatuses[customConfigIndex] = connectionTestStatus;
        },
        "customConfigDeleted": (
            state,
            {
                payload
            }: {
                payload: {
                    customConfigIndex: number;
                };
            }
        ) => {
            const { customConfigIndex } = payload;

            state.connectionTestStatuses.splice(customConfigIndex, 1);
        },
        "connectionTestStarted": (
            state,
            {
                payload
            }: {
                payload: {
                    customConfigIndex: number;
                };
            }
        ) => {
            const { customConfigIndex } = payload;

            const connectionTestStatus = state.connectionTestStatuses[customConfigIndex];

            assert(connectionTestStatus !== undefined);

            connectionTestStatus.isTestOngoing = true;
        },
        "connectionTestSucceeded": (
            state,
            {
                payload
            }: {
                payload: {
                    customConfigIndex: number;
                };
            }
        ) => {
            const { customConfigIndex } = payload;

            state.connectionTestStatuses[customConfigIndex] =
                id<ConnectionTestStatus.Success>({
                    "isTestOngoing": false,
                    "stateDescription": "success"
                });
        },
        "connectionTestFailed": (
            state,
            {
                payload
            }: {
                payload: {
                    customConfigIndex: number;
                    errorMessage: string;
                };
            }
        ) => {
            const { customConfigIndex, errorMessage } = payload;

            state.connectionTestStatuses[customConfigIndex] =
                id<ConnectionTestStatus.Failed>({
                    "isTestOngoing": false,
                    "stateDescription": "failed",
                    errorMessage
                });
        }
    }
});
