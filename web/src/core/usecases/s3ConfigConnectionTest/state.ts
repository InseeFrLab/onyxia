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
    workingDirectoryPath: string;
};

export type ConfigTestResult = {
    paramsOfCreateS3Client: ParamsOfCreateS3Client;
    workingDirectoryPath: string;
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
            const { paramsOfCreateS3Client, workingDirectoryPath } = payload;

            if (
                state.ongoingConfigTests.find(e =>
                    same(e, { paramsOfCreateS3Client, workingDirectoryPath })
                ) !== undefined
            ) {
                return;
            }

            state.ongoingConfigTests.push({
                paramsOfCreateS3Client,
                workingDirectoryPath
            });
        },
        testCompleted: (
            state,
            {
                payload
            }: {
                payload: State["configTestResults"][number];
            }
        ) => {
            const { paramsOfCreateS3Client, workingDirectoryPath, result } = payload;

            remove_from_ongoing: {
                const entry = state.ongoingConfigTests.find(e =>
                    same(e, { paramsOfCreateS3Client, workingDirectoryPath })
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
                const entry = state.configTestResults.find(
                    e =>
                        same(e.paramsOfCreateS3Client, paramsOfCreateS3Client) &&
                        e.workingDirectoryPath === workingDirectoryPath
                );

                if (entry === undefined) {
                    break remove_existing_result;
                }

                state.configTestResults.splice(state.configTestResults.indexOf(entry), 1);
            }

            state.configTestResults.push({
                paramsOfCreateS3Client,
                workingDirectoryPath,
                result
            });
        }
    }
});
