import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import type { ParamsOfCreateS3Client } from "core/adapters/s3Client";
import { same } from "evt/tools/inDepth/same";

type State = {
    configTestResults: ConfigTestResult[];
    ongoingConfigTests: OngoingConfigTest[];
};

export type OngoingConfigTest = {
    paramsOfCreateS3Client: ParamsOfCreateS3Client;
};

export type ConfigTestResult = {
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

export const name = "s3ConfigConnectionTest";

export const { actions, reducer } = createUsecaseActions({
    name,
    initialState: id<State>({
        configTestResults: [],
        ongoingConfigTests: []
    }),
    reducers: {
        testStarted: (
            state,
            {
                payload
            }: {
                payload: State["ongoingConfigTests"][number];
            }
        ) => {
            const { paramsOfCreateS3Client } = payload;

            if (
                state.ongoingConfigTests.find(e =>
                    same(e, { paramsOfCreateS3Client })
                ) !== undefined
            ) {
                return;
            }

            state.ongoingConfigTests.push({ paramsOfCreateS3Client });
        },
        testCompleted: (
            state,
            {
                payload
            }: {
                payload: State["configTestResults"][number];
            }
        ) => {
            const { paramsOfCreateS3Client, result } = payload;

            remove_from_ongoing: {
                const entry = state.ongoingConfigTests.find(e =>
                    same(e, { paramsOfCreateS3Client })
                );

                if (entry === undefined) {
                    break remove_from_ongoing;
                }

                state.ongoingConfigTests.splice(
                    state.ongoingConfigTests.indexOf(entry),
                    1
                );
            }

            remove_existing_result: {
                const entry = state.configTestResults.find(e =>
                    same(e.paramsOfCreateS3Client, paramsOfCreateS3Client)
                );

                if (entry === undefined) {
                    break remove_existing_result;
                }

                state.configTestResults.splice(state.configTestResults.indexOf(entry), 1);
            }

            state.configTestResults.push({
                paramsOfCreateS3Client,
                result
            });
        }
    }
});
