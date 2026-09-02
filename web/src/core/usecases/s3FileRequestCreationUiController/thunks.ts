import type { Thunks } from "core/bootstrap";
import * as s3ProfilesManagement from "core/usecases/s3ProfilesManagement";
import { assert } from "tsafe/assert";
import { actions, type State } from "./state";
import { privateSelectors } from "./selectors";
import type { S3Uri } from "core/tools/S3Uri";

let nextGenerationId = 0;

export const thunks = {
    load:
        (params: { s3Uri: S3Uri.TerminatedByDelimiter }) =>
        async (...args) => {
            const { s3Uri } = params;

            const [dispatch, getState] = args;

            const s3Profile = s3ProfilesManagement.selectors.ambientS3Profile(getState());

            assert(s3Profile !== undefined);

            const s3Client = await dispatch(
                s3ProfilesManagement.protectedThunks.getS3Client({
                    profileName: s3Profile.profileName
                })
            );

            const isEmptyPrefix = await (async () => {
                const result = await s3Client.listObjects({ s3Uri });

                if (!result.isSuccess) {
                    return false;
                }

                return result.objects.length === 0 && result.prefixes.length === 0;
            })();

            dispatch(
                actions.loaded({
                    s3Uri,
                    profileName: s3Profile.profileName,
                    isEmptyPrefix
                })
            );
        },
    changeValidityDuration:
        (params: { validityDuration: State.ValidityDuration }) =>
        (...args) => {
            const [dispatch] = args;

            dispatch(actions.validityDurationChanged(params));
        },
    changeMaxObjectSize:
        (params: { maxObjectSize: State.MaxObjectSize }) =>
        (...args) => {
            const [dispatch] = args;

            dispatch(actions.maxObjectSizeChanged(params));
        },
    retryGeneration:
        () =>
        (...args) => {
            const [dispatch] = args;

            dispatch(privateThunks.updatePresignedPost());
        }
} satisfies Thunks;

export const privateThunks = {
    updatePresignedPost:
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const generationId = ++nextGenerationId;

            dispatch(actions.generationStarted({ generationId }));

            const { s3Uri, profileName, validityDuration, maxObjectSize } =
                privateSelectors.createPresignedPostParams(getState());

            const s3Client = await dispatch(
                s3ProfilesManagement.protectedThunks.getS3Client({ profileName })
            );

            const result = await s3Client.createPresignedPost({
                s3Uri,
                validityDurationSecond: (() => {
                    switch (validityDuration) {
                        case "one hour":
                            return 60 * 60;
                        case "one day":
                            return 60 * 60 * 24;
                        case "one week":
                            return 60 * 60 * 24 * 7;
                    }
                })(),
                maxObjectSizeInBytes: (() => {
                    switch (maxObjectSize) {
                        case "no limit":
                            return undefined;
                        case "10 MB":
                            return 10 * 1024 ** 2;
                        case "100 MB":
                            return 100 * 1024 ** 2;
                        case "1 GB":
                            return 1024 ** 3;
                        case "5 GB":
                            return 5 * 1024 ** 3;
                    }
                })()
            });

            if (!result.isSuccess) {
                dispatch(
                    actions.generationFailed({
                        generationId,
                        errorMessage: result.errorMessage
                    })
                );
                return;
            }

            dispatch(
                actions.generationSucceeded({
                    generationId,
                    presignedPost: result.presignedPost
                })
            );
        }
} satisfies Thunks;
