import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name, type State } from "./state";

const state = (rootState: RootState): State => rootState[name];

const presignedPost = createSelector(state, state => state.presignedPost);

const s3ServerUrl = createSelector(state, state => state.s3ServerUrl);

const s3UriStr = createSelector(state, state => state.s3UriStr);

const uploads = createSelector(state, state => state.uploads);

export type MainView = {
    expirationTime: number;
    s3ServerUrl: string;
    s3UriStr: string;
    uploads: State.Upload[];
    isUploading: boolean;
};

const mainView = createSelector(
    presignedPost,
    s3ServerUrl,
    s3UriStr,
    uploads,
    (presignedPost, s3ServerUrl, s3UriStr, uploads): MainView => ({
        expirationTime: presignedPost.expirationTime,
        s3ServerUrl,
        s3UriStr,
        uploads,
        isUploading: uploads.some(upload => upload.status === "uploading")
    })
);

export const selectors = { mainView };

export const privateSelectors = { presignedPost, uploads };
