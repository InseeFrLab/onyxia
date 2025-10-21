import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import type { ParamsOfCreateS3Client } from "core/adapters/s3Client";
import { same } from "evt/tools/inDepth/same";

export type State = {
    testResults: State.TestResult[];
    ongoingTests: State.OngoingTest[];
};

export namespace State {
    export type OngoingTest = {
        paramsOfCreateS3Client: ParamsOfCreateS3Client;
    };

    export type TestResult = {
        paramsOfCreateS3Client: ParamsOfCreateS3Client;
        result:
            | {
                  isSuccess: true;
              }
            | {
                  isSuccess: false;
                  errorMessage: string;
              };
    };
}

export const name = "s3CredentialsTest";

export const { actions, reducer } = createUsecaseActions({
    name,
    initialState: id<State>({
        testResults: [],
        ongoingTests: []
    }),
    reducers: {
        testStarted: (
            state,
            {
                payload
            }: {
                payload: State["ongoingTests"][number];
            }
        ) => {
            const { paramsOfCreateS3Client } = payload;

            if (
                state.ongoingTests.find(e => same(e, { paramsOfCreateS3Client })) !==
                undefined
            ) {
                return;
            }

            state.ongoingTests.push({ paramsOfCreateS3Client });
        },
        testCompleted: (
            state,
            {
                payload
            }: {
                payload: State["testResults"][number];
            }
        ) => {
            const { paramsOfCreateS3Client, result } = payload;

            remove_from_ongoing: {
                const entry = state.ongoingTests.find(e =>
                    same(e, { paramsOfCreateS3Client })
                );

                if (entry === undefined) {
                    break remove_from_ongoing;
                }

                state.ongoingTests.splice(state.ongoingTests.indexOf(entry), 1);
            }

            remove_existing_result: {
                const entry = state.testResults.find(e =>
                    same(e.paramsOfCreateS3Client, paramsOfCreateS3Client)
                );

                if (entry === undefined) {
                    break remove_existing_result;
                }

                state.testResults.splice(state.testResults.indexOf(entry), 1);
            }

            state.testResults.push({
                paramsOfCreateS3Client,
                result
            });
        }
    }
});
