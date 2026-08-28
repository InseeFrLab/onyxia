import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import { name, type State } from "./state";

const state = (rootState: RootState): State => rootState[name];

export type MainView = {
    folderName: string;
    validityDuration: State.ValidityDuration;
    maxObjectSize: State.MaxObjectSize;
    presignedPost: State["presignedPost"];
    errorMessage: string | undefined;
};

const mainView = createSelector(
    state,
    ({
        s3Uri,
        validityDuration,
        maxObjectSize,
        presignedPost,
        errorMessage
    }): MainView => ({
        folderName: s3Uri.keySegments.at(-1) ?? s3Uri.bucket,
        validityDuration,
        maxObjectSize,
        presignedPost,
        errorMessage
    })
);

const createPresignedPostParams = createSelector(
    state,
    ({ s3Uri, profileName, validityDuration, maxObjectSize }) => ({
        s3Uri,
        profileName,
        validityDuration,
        maxObjectSize
    })
);

export const selectors = { mainView };

export const privateSelectors = { createPresignedPostParams };
