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
    selectedProfileName: string | undefined;
    availableS3Profiles: {
        profileName: string;
        displayName: string;
    }[];
    bookmarks: {
        displayName: LocalizedString | undefined;
        s3UriPrefixObj: S3UriPrefixObj;
    }[];
    s3UriPrefixObj: S3UriPrefixObj | undefined;
    bookmarkStatus:
        | {
              isBookmarked: false;
          }
        | {
              isBookmarked: true;
              isReadonly: boolean;
          };
};

const view = createSelector(
    protectedSelectors.isStateInitialized,
    protectedSelectors.routeParams,
    s3ProfilesManagement.selectors.s3Profiles,
    (isStateInitialized, routeParams, s3Profiles): View => {
        assert(isStateInitialized);

        if (routeParams.profile === undefined) {
            return {
                selectedProfileName: undefined,
                availableS3Profiles: [],
                bookmarks: [],
                s3UriPrefixObj: undefined,
                bookmarkStatus: {
                    isBookmarked: false
                }
            };
        }

        const profileName = routeParams.profile;

        const s3Profile = s3Profiles.find(
            s3Profile => s3Profile.profileName === profileName
        );

        // NOTE: We enforce this invariant while loading the route
        assert(s3Profile !== undefined);

        const s3UriPrefixObj =
            routeParams.path === ""
                ? undefined
                : parseS3UriPrefix({
                      s3UriPrefix: `s3://${routeParams.path}`,
                      strict: false
                  });

        return {
            selectedProfileName: profileName,
            availableS3Profiles: s3Profiles.map(s3Profile => ({
                profileName: s3Profile.profileName,
                displayName: s3Profile.paramsOfCreateS3Client.url
            })),
            bookmarks: s3Profile.bookmarks,
            s3UriPrefixObj,
            bookmarkStatus: (() => {
                if (s3UriPrefixObj === undefined) {
                    return {
                        isBookmarked: false
                    };
                }

                const bookmark = s3Profile.bookmarks.find(bookmark =>
                    same(bookmark.s3UriPrefixObj, s3UriPrefixObj)
                );

                if (bookmark === undefined) {
                    return {
                        isBookmarked: false
                    };
                }

                return {
                    isBookmarked: true,
                    isReadonly: bookmark.isReadonly
                };
            })()
        };
    }
);

export const selectors = { view };
