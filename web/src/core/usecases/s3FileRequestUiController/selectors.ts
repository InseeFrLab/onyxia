import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name, type State } from "./state";

const state = (rootState: RootState): State => rootState[name];

const presignedPost = createSelector(state, state => state.presignedPost);

const uploads = createSelector(state, state => state.uploads);

export type MainView = {
    expirationTime: number;
    uploads: State.Upload[];
    isUploading: boolean;
};

const mainView = createSelector(
    presignedPost,
    uploads,
    (presignedPost, uploads): MainView => ({
        expirationTime: presignedPost.expirationTime,
        uploads,
        isUploading: uploads.some(upload => upload.status === "uploading")
    })
);

export const selectors = { mainView };

export const privateSelectors = { presignedPost, uploads };
