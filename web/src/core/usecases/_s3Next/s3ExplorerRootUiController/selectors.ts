import type { State as RootState } from "core/bootstrap";
import { name } from "./state";
import { isObjectThatThrowIfAccessed, createSelector } from "clean-architecture";
import { assert } from "tsafe";
import * as s3ProfilesManagement from "core/usecases/_s3Next/s3ProfilesManagement";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import { type S3UriPrefixObj, parseS3UriPrefix } from "core/tools/S3Uri";
import { same } from "evt/tools/inDepth/same";

const state = (rootState: RootState) => rootState[name];

export const protectedSelectors = {
    isStateInitialized: createSelector(
        state,
        state => !isObjectThatThrowIfAccessed(state)
    ),
    routeParams: createSelector(state, state => state.routeParams)
};

export type View = {
    selectedS3ProfileId: string | undefined;
    availableS3Profiles: {
        id: string;
        displayName: string;
    }[];
    bookmarks: {
        displayName: LocalizedString | undefined;
        s3UriPrefixObj: S3UriPrefixObj;
    }[];
    s3UriPrefixObj: S3UriPrefixObj | undefined;
    isS3UriPrefixBookmarked: boolean;
};

const view = createSelector(
    protectedSelectors.isStateInitialized,
    protectedSelectors.routeParams,
    s3ProfilesManagement.selectors.s3Profiles,
    (isStateInitialized, routeParams, s3Profiles): View => {
        assert(isStateInitialized);

        if (routeParams.profile === undefined) {
            return {
                selectedS3ProfileId: undefined,
                availableS3Profiles: [],
                bookmarks: [],
                s3UriPrefixObj: undefined,
                isS3UriPrefixBookmarked: false
            };
        }

        const selectedS3ProfileId = routeParams.profile;

        const s3Profile = s3Profiles.find(
            s3Profile => s3Profile.id === selectedS3ProfileId
        );

        // TODO: Handle this case gratefully
        assert(
            s3Profile !== undefined,
            "The profile in the root url does not exist in configuration"
        );

        const s3UriPrefixObj =
            routeParams.path === ""
                ? undefined
                : parseS3UriPrefix({
                      s3UriPrefix: `s3://${routeParams.path}`,
                      strict: false
                  });

        return {
            selectedS3ProfileId,
            availableS3Profiles: s3Profiles.map(s3Profile => ({
                id: s3Profile.id,
                displayName: s3Profile.paramsOfCreateS3Client.url
            })),
            bookmarks: s3Profile.bookmarks,
            s3UriPrefixObj,
            isS3UriPrefixBookmarked:
                s3UriPrefixObj === undefined
                    ? false
                    : s3Profile.bookmarks.some(bookmark =>
                          same(bookmark.s3UriPrefixObj, s3UriPrefixObj)
                      )
        };
    }
);

export const selectors = { view };
