import { createSelector } from "clean-architecture";
import * as s3ProfilesManagement from "core/usecases/s3ProfilesManagement";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import {
    type S3UriPrefixObj,
    type S3UriObj,
    stringifyS3UriPrefixObj
} from "core/tools/S3Uri";
import type { State as RootState } from "core/bootstrap";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import { same } from "evt/tools/inDepth/same";
import { computeUploadStatusAtPrefix } from "./decoupledLogic/computeUploadStatusAtPrefix";
import { name, type State } from "./state";

export type RouteParams = {
    profile?: string;
    prefix: string;
};

export type MainView = {
    // NOTE: Undefined is when no profile (user should be prompted to create one)
    profileSelect:
        | {
              value: string;
              options: string[];
              isEditable: boolean;
          }
        | undefined;
    bookmarks: {
        displayName: LocalizedString | undefined;
        s3UriPrefixObj: S3UriPrefixObj;
    }[];

    navigationBarValue: string;
    isListing: boolean;

    listedPrefix:
        | {
              isErrored: true;
              errorCase: State.ListedPrefix.ErrorCase;
          }
        | {
              isErrored: false;
              bookmarkStatus:
                  | {
                        isBookmarked: false;
                    }
                  | {
                        isBookmarked: true;
                        isReadonly: boolean;
                    };
              items: MainView.Item[];
          }
        | undefined;
};

export namespace MainView {
    export type Item = Item.PrefixSegment | Item.Object;

    export namespace Item {
        type Common = {
            uploadProgressPercent: number | undefined;
            displayName: string;
        };

        export type PrefixSegment = Common & {
            type: "prefix segment";
            s3UriPrefixObj: S3UriPrefixObj;
        };

        export type Object = Common & {
            type: "object";
            s3UriObj: S3UriObj;
        };
    }
}

const state = (rootState: RootState): State => rootState[name];

const profileName = createSelector(
    s3ProfilesManagement.selectors.ambientS3Profile,
    ambientS3Profile => ambientS3Profile?.profileName
);

const s3UriPrefixObj = createSelector(
    createSelector(state, state => state.listedPrefixByProfile),
    profileName,
    (listedPrefixByProfile, profileName): S3UriPrefixObj | undefined => {
        if (profileName === undefined) {
            return undefined;
        }

        const listedPrefix = listedPrefixByProfile[profileName];

        if (listedPrefix === undefined) {
            return undefined;
        }

        if (listedPrefix.next !== undefined) {
            return listedPrefix.next.s3UriPrefixObj;
        }

        if (listedPrefix.current === undefined) {
            return undefined;
        }

        return listedPrefix.current.s3UriPrefixObj;
    }
);

const routeParams = createSelector(
    profileName,
    s3UriPrefixObj,
    (profileName, s3UriPrefixObj): RouteParams => ({
        profile: profileName,
        prefix:
            s3UriPrefixObj === undefined
                ? ""
                : stringifyS3UriPrefixObj(s3UriPrefixObj).slice("s3://".length)
    })
);

const profileSelect = createSelector(
    s3ProfilesManagement.selectors.ambientS3Profile,
    s3ProfilesManagement.selectors.s3Profiles,
    (ambientS3Profile, s3Profiles): MainView["profileSelect"] => {
        if (ambientS3Profile === undefined) {
            return undefined;
        }

        return {
            value: ambientS3Profile.profileName,
            options: s3Profiles.map(s3Profile => s3Profile.profileName),
            isEditable:
                ambientS3Profile.origin === "created by user (or group project member)"
        };
    }
);

const bookmarks = createSelector(
    s3ProfilesManagement.selectors.ambientS3Profile,
    (ambientS3Profile): MainView["bookmarks"] => {
        if (ambientS3Profile === undefined) {
            return [];
        }

        return ambientS3Profile.bookmarks.map(bookmark => ({
            displayName: bookmark.displayName,
            s3UriPrefixObj: bookmark.s3UriPrefixObj
        }));
    }
);

const navigationBarValue = createSelector(
    s3UriPrefixObj,
    (s3UriPrefixObj): MainView["navigationBarValue"] =>
        s3UriPrefixObj === undefined ? "s3://" : stringifyS3UriPrefixObj(s3UriPrefixObj)
);

const listedPrefix_state = createSelector(
    state,
    profileName,
    (state, profileName): State.ListedPrefix | undefined => {
        if (profileName === undefined) {
            return undefined;
        }

        return state.listedPrefixByProfile[profileName];
    }
);

const isListing = createSelector(
    listedPrefix_state,
    (listedPrefix_state): MainView["isListing"] => {
        if (listedPrefix_state === undefined) {
            return false;
        }

        if (listedPrefix_state.next === undefined) {
            return false;
        }

        if (listedPrefix_state.next.errorCase !== undefined) {
            return false;
        }

        return true;
    }
);

const uploads_profile = createSelector(
    createSelector(state, state => state.uploads),
    profileName,
    (uploads, profileName): State.Upload[] => {
        if (profileName === undefined) {
            return [];
        }

        return uploads.filter(upload => upload.profileName === profileName);
    }
);

const items = createSelector(
    listedPrefix_state,
    uploads_profile,
    (listedPrefix_state, uploads_profile): MainView.Item[] | undefined => {
        if (listedPrefix_state === undefined) {
            return undefined;
        }

        if (listedPrefix_state.current === undefined) {
            return undefined;
        }

        const items: MainView.Item[] = [
            ...listedPrefix_state.current.items.map(item => {
                switch (item.type) {
                    case "object":
                        return id<MainView.Item.Object>({
                            type: "object",
                            displayName: item.s3UriObj.basename,
                            s3UriObj: item.s3UriObj,
                            uploadProgressPercent: undefined
                        });
                    case "prefix segment":
                        return id<MainView.Item.PrefixSegment>({
                            type: "prefix segment",
                            displayName: [
                                ...item.s3UriPrefixObj.keySegments
                            ].reverse()[0],
                            s3UriPrefixObj: item.s3UriPrefixObj,
                            uploadProgressPercent: undefined
                        });
                }
            }),
            ...computeUploadStatusAtPrefix({
                s3UriPrefixObj: listedPrefix_state.current.s3UriPrefixObj,
                uploads: uploads_profile
            })
        ].sort((a, b) => a.displayName.localeCompare(b.displayName));

        return items;
    }
);

const listedPrefix = createSelector(
    listedPrefix_state,
    s3ProfilesManagement.selectors.ambientS3Profile,
    items,
    (listedPrefix_state, ambientS3Profile, items): MainView["listedPrefix"] => {
        if (listedPrefix_state === undefined) {
            return undefined;
        }

        if (
            listedPrefix_state.next !== undefined &&
            listedPrefix_state.next.errorCase !== undefined
        ) {
            return {
                isErrored: true,
                errorCase: listedPrefix_state.next.errorCase
            };
        }

        if (listedPrefix_state.current === undefined) {
            return undefined;
        }

        assert(ambientS3Profile !== undefined);
        assert(items !== undefined);

        const { s3UriPrefixObj } = listedPrefix_state.current;

        const bookmark = ambientS3Profile.bookmarks.find(bookmark =>
            same(bookmark.s3UriPrefixObj, s3UriPrefixObj)
        );

        return {
            isErrored: false,
            bookmarkStatus:
                bookmark === undefined
                    ? { isBookmarked: false }
                    : {
                          isBookmarked: true,
                          isReadonly: bookmark.isReadonly
                      },
            items
        };
    }
);

const mainView = createSelector(
    profileSelect,
    bookmarks,
    navigationBarValue,
    isListing,
    listedPrefix,
    (
        profileSelect,
        bookmarks,
        navigationBarValue,
        isListing,
        listedPrefix
    ): MainView => ({
        profileSelect,
        bookmarks,
        navigationBarValue,
        isListing,
        listedPrefix
    })
);

export const selectors = {
    mainView
};

const s3UriPrefixObj_currentlyListing = createSelector(
    listedPrefix_state,
    listedPrefix_state => {
        if (listedPrefix_state === undefined) {
            return undefined;
        }

        if (listedPrefix_state.next === undefined) {
            return undefined;
        }

        if (listedPrefix_state.next.errorCase !== undefined) {
            return undefined;
        }

        return listedPrefix_state.next.s3UriPrefixObj;
    }
);

export const privateSelectors = {
    routeParams,
    s3UriPrefixObj,
    profileName,
    s3UriPrefixObj_currentlyListing
};
