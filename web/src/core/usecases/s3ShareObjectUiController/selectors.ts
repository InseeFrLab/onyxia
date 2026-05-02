import type { State as RootState } from "core/bootstrap";
import { name, type State } from "./state";
import { createSelector } from "clean-architecture";
import { assert, id } from "tsafe";
import * as s3ExplorerUiController from "core/usecases/s3ExplorerUiController";
import { getIsPublic } from "core/usecases/s3ExplorerUiController/decoupledLogic/bucketPolicy";

const state = (rootState: RootState) => rootState[name];

export type MainView = MainView.Public | MainView.Private;

export namespace MainView {
    type Common = {
        objectBasename: string;
        httpUrl: string | undefined;
    };

    export type Public = Common & {
        isPublic: true;
    };

    export type Private = Common & {
        isPublic: false | undefined;
        validityDuration: State.ValidityDuration;
    };
}

const s3Uri = createSelector(state, state => state.s3Uri);

const isPublic = createSelector(
    s3Uri,
    s3ExplorerUiController.protectedSelectors.bucketPolicyByBucket,
    (s3Uri, bucketPolicyByBucket) =>
        getIsPublic({
            s3Uri,
            bucketPolicyByBucket
        })
);

const validityDuration = createSelector(state, state => state.validityDuration);

const mainView = createSelector(
    isPublic,
    createSelector(s3Uri, s3Uri => {
        const objectBasename = s3Uri.keySegments.at(-1);
        assert(objectBasename !== undefined);
        return objectBasename;
    }),
    createSelector(state, state => state.httpUrl),
    createSelector(state, state => state.validityDuration),
    (isPublic, objectBasename, httpUrl, validityDuration): MainView => {
        const common = {
            objectBasename,
            httpUrl
        };

        return isPublic
            ? id<MainView.Public>({
                  ...common,
                  isPublic: true
              })
            : id<MainView.Private>({
                  ...common,
                  isPublic: false,
                  validityDuration
              });
    }
);

export const selectors = { mainView };

export const privateSelectors = { s3Uri, isPublic, validityDuration };
