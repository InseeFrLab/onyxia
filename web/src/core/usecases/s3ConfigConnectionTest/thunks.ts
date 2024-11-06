import type { Thunks } from "core/bootstrap";
import { actions } from "./state";
import { assert } from "tsafe/assert";

import type { ParamsOfCreateS3Client } from "core/adapters/s3Client";

export const thunks = {} satisfies Thunks;

export const protectedThunks = {
    testS3Connection:
        (params: {
            paramsOfCreateS3Client: ParamsOfCreateS3Client.NoSts;
            workingDirectoryPath: string;
        }) =>
        async (...args) => {
            const { paramsOfCreateS3Client, workingDirectoryPath } = params;

            const [dispatch] = args;

            dispatch(
                actions.testStarted({ paramsOfCreateS3Client, workingDirectoryPath })
            );

            const result = await (async () => {
                const { createS3Client } = await import("core/adapters/s3Client");

                const getOidc = () => {
                    assert(false);
                };

                const s3Client = createS3Client(paramsOfCreateS3Client, getOidc);

                try {
                    await s3Client.listObjects({
                        path: workingDirectoryPath
                    });
                } catch (error) {
                    return {
                        isSuccess: false as const,
                        errorMessage: String(error)
                    };
                }

                return { isSuccess: true as const };
            })();

            dispatch(
                actions.testCompleted({
                    paramsOfCreateS3Client,
                    workingDirectoryPath,
                    result
                })
            );
        }
} satisfies Thunks;
