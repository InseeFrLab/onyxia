import {
    createObjectThatThrowsIfAccessed,
    createUsecaseActions
} from "clean-architecture";
import type { S3Client } from "core/ports/S3Client";
import type { S3Uri } from "core/tools/S3Uri";
import { id } from "tsafe/id";

export type PresignedPost = S3Client.PresignedPost;

export type State = {
    s3Uri: S3Uri.TerminatedByDelimiter;
    profileName: string;
    validityDuration: State.ValidityDuration;
    maxObjectSize: State.MaxObjectSize;
    generationId: number | undefined;
    presignedPost: PresignedPost | undefined;
    errorMessage: string | undefined;
};

export namespace State {
    export type ValidityDuration = "one hour" | "one day" | "one week";

    export type MaxObjectSize = "no limit" | "10 MB" | "100 MB" | "1 GB" | "5 GB";
}

export const name = "s3FileRequestCreationUiController";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: createObjectThatThrowsIfAccessed<State>(),
    reducers: {
        loaded: (
            _state,
            {
                payload
            }: {
                payload: {
                    s3Uri: S3Uri.TerminatedByDelimiter;
                    profileName: string;
                };
            }
        ) =>
            id<State>({
                ...payload,
                validityDuration: "one day",
                maxObjectSize: "no limit",
                generationId: undefined,
                presignedPost: undefined,
                errorMessage: undefined
            }),
        validityDurationChanged: (
            state,
            { payload }: { payload: { validityDuration: State.ValidityDuration } }
        ) => {
            state.validityDuration = payload.validityDuration;
        },
        maxObjectSizeChanged: (
            state,
            { payload }: { payload: { maxObjectSize: State.MaxObjectSize } }
        ) => {
            state.maxObjectSize = payload.maxObjectSize;
        },
        generationStarted: (
            state,
            { payload }: { payload: { generationId: number } }
        ) => {
            state.generationId = payload.generationId;
            state.presignedPost = undefined;
            state.errorMessage = undefined;
        },
        generationSucceeded: (
            state,
            {
                payload
            }: {
                payload: {
                    generationId: number;
                    presignedPost: PresignedPost;
                };
            }
        ) => {
            if (state.generationId !== payload.generationId) {
                return;
            }

            state.generationId = undefined;
            state.presignedPost = payload.presignedPost;
        },
        generationFailed: (
            state,
            { payload }: { payload: { generationId: number; errorMessage: string } }
        ) => {
            if (state.generationId !== payload.generationId) {
                return;
            }

            state.generationId = undefined;
            state.errorMessage = payload.errorMessage;
        }
    }
});
