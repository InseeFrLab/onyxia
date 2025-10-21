import type { Thunks } from "core/bootstrap";
import { actions } from "./state";
import { assert } from "tsafe/assert";

import type { ParamsOfCreateS3Client } from "core/adapters/s3Client";

export const thunks = {} satisfies Thunks;

export const protectedThunks = {
    testS3Credentials:
        (params: { paramsOfCreateS3Client: ParamsOfCreateS3Client }) =>
        async (...args) => {
            const { paramsOfCreateS3Client } = params;

            const [dispatch] = args;

            dispatch(actions.testStarted({ paramsOfCreateS3Client }));

            const result = await (async () => {
                const { createS3Client } = await import("core/adapters/s3Client");

                const getOidc = () => {
                    // TODO: Fix, since we allow testing sts connection
                    assert(false);
                };

                const s3Client = createS3Client(paramsOfCreateS3Client, getOidc);

                try {
                    console.log("Find a way to test only s3 credential", s3Client);
                    throw new Error("TODO: Not implemented yet");
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
                    result
                })
            );
        }
} satisfies Thunks;
