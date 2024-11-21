import "minimal-polyfills/Object.fromEntries";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import { createUsecaseActions } from "clean-architecture";

export type Technology =
    | "R (aws.S3)"
    | "R (aws.S3)"
    | "R (paws)"
    | "Python (s3fs)"
    | "Python (boto3)"
    | "Python (polars)"
    | "shell environment variables"
    | "MC client"
    | "s3cmd"
    | "rclone";

type State = State.NotRefreshed | State.Ready;

namespace State {
    type Common = {
        isRefreshing: boolean;
    };

    export type NotRefreshed = Common & {
        stateDescription: "not refreshed";
    };

    export type Ready = Common & {
        stateDescription: "ready";
        expirationTime: number;
        credentials: {
            AWS_ACCESS_KEY_ID: string;
            AWS_SECRET_ACCESS_KEY: string;
            AWS_DEFAULT_REGION: string;
            AWS_SESSION_TOKEN: string;
            AWS_S3_ENDPOINT: string;
        };
        selectedTechnology: Technology;
    };
}

export const name = "s3CodeSnippets";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>(
        id<State.NotRefreshed>({
            stateDescription: "not refreshed",
            isRefreshing: false
        })
    ),
    reducers: {
        refreshStarted: state => {
            state.isRefreshing = true;
        },
        refreshed: (
            state,
            {
                payload
            }: {
                payload: {
                    credentials: State.Ready["credentials"];
                    expirationTime: number;
                };
            }
        ) => {
            const { credentials, expirationTime } = payload;

            const selectedTechnology: Technology =
                state.stateDescription === "ready"
                    ? state.selectedTechnology
                    : "R (paws)";

            return id<State.Ready>({
                isRefreshing: false,
                stateDescription: "ready",
                selectedTechnology,
                credentials,
                expirationTime
            });
        },
        technologyChanged: (
            state,
            { payload }: { payload: { technology: Technology } }
        ) => {
            const { technology } = payload;
            assert(state.stateDescription === "ready");
            state.selectedTechnology = technology;
        }
    }
});
