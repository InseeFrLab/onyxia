import { createSelector } from "clean-architecture";
import * as s3ProfilesManagement from "core/usecases/s3ProfilesManagement";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import { type S3Uri, stringifyS3Uri } from "core/tools/S3Uri";
import type { State as RootState } from "core/bootstrap";
import { assert, type Equals } from "tsafe";
import { id } from "tsafe/id";
import { same } from "evt/tools/inDepth/same";
import { computeUploadStatusAtPrefix } from "./decoupledLogic/computeUploadStatusAtPrefix";
import { name, type State } from "./state";

export type RouteParams = {
    profile?: string;
    s3UriPrefixWithoutScheme: string;
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
        s3UriPrefix: S3Uri.Prefix;
    }[];

    uploads: State.Upload[];

    uriBar: {
        s3UriPrefix: S3Uri.Prefix | undefined;
        hints: {
            type: "object" | "key-segment" | "bookmark";
            text: string;
        }[];
        bookmarkStatus:
            | {
                  isBookmarked: false;
              }
            | {
                  isBookmarked: true;
                  isReadonly: boolean;
              };
    };

    isListing: boolean;

    listedPrefix:
        | {
              isErrored: true;
              errorCase: State.ListedPrefix.ErrorCase;
          }
        | {
              isErrored: false;
              /*
              bookmarkStatus:
                  | {
                        isBookmarked: false;
                    }
                  | {
                        isBookmarked: true;
                        isReadonly: boolean;
                    };
                */
              items: MainView.Item[];
          }
        | undefined;
};

export namespace MainView {
    export type Item = Item.PrefixSegment | Item.Object;

    export namespace Item {
        type Common = {
            uploadProgressPercent: number | undefined;
            isDeleting: boolean;
            displayName: string;
        };

        export type PrefixSegment = Common & {
            type: "prefix segment";
            s3UriPrefix: S3Uri.Prefix.TerminatedByDelimiter;
        };

        export type Object = Common & {
            type: "object";
            s3Uri: S3Uri.Object;
        };
    }
}

const state = (rootState: RootState): State => rootState[name];

const profileName = createSelector(
    s3ProfilesManagement.selectors.ambientS3Profile,
    ambientS3Profile => ambientS3Profile?.profileName
);

const s3UriPrefix = createSelector(
    createSelector(state, state => state.listedPrefixByProfile),
    profileName,
    (listedPrefixByProfile, profileName): S3Uri.Prefix | undefined => {
        if (profileName === undefined) {
            return undefined;
        }

        const listedPrefix = listedPrefixByProfile[profileName];

        if (listedPrefix === undefined) {
            return undefined;
        }

        if (listedPrefix.next !== undefined) {
            return listedPrefix.next.s3UriPrefix;
        }

        if (listedPrefix.current === undefined) {
            return undefined;
        }

        return listedPrefix.current.s3UriPrefix;
    }
);

const routeParams = createSelector(
    profileName,
    s3UriPrefix,
    (profileName, s3UriPrefix): RouteParams => ({
        profile: profileName,
        s3UriPrefixWithoutScheme:
            s3UriPrefix === undefined
                ? ""
                : stringifyS3Uri(s3UriPrefix).slice("s3://".length)
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
            s3UriPrefix: bookmark.s3UriPrefix
        }));
    }
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

const deletions_profile = createSelector(
    createSelector(state, state => state.deletions),
    profileName,
    (deletions, profileName): State.Deletion[] => {
        if (profileName === undefined) {
            return [];
        }

        return deletions.filter(deletion => deletion.profileName === profileName);
    }
);

const items = createSelector(
    listedPrefix_state,
    uploads_profile,
    deletions_profile,
    (
        listedPrefix_state,
        uploads_profile,
        deletions_profile
    ): MainView.Item[] | undefined => {
        if (listedPrefix_state === undefined) {
            return undefined;
        }

        if (listedPrefix_state.current === undefined) {
            return undefined;
        }

        const items_upload: MainView.Item[] = computeUploadStatusAtPrefix({
            s3UriPrefix: listedPrefix_state.current.s3UriPrefix,
            uploads: uploads_profile
        });

        const items_actual: MainView.Item[] = listedPrefix_state.current.items.map(
            item => {
                switch (item.type) {
                    case "object":
                        return id<MainView.Item.Object>({
                            type: "object",
                            displayName: item.s3Uri.keyBasename,
                            s3Uri: item.s3Uri,
                            uploadProgressPercent: undefined,
                            isDeleting: false
                        });
                    case "prefix":
                        return id<MainView.Item.PrefixSegment>({
                            type: "prefix segment",
                            displayName: [...item.s3UriPrefix.keySegments].reverse()[0],
                            s3UriPrefix: item.s3UriPrefix,
                            uploadProgressPercent: undefined,
                            isDeleting: false
                        });
                }
            }
        );

        const items: MainView.Item[] = [];

        for (const item_upload of items_upload) {
            if (
                item_upload.uploadProgressPercent === 100 &&
                items_actual.find(
                    item_actual => item_actual.displayName === item_upload.displayName
                ) !== undefined
            ) {
                continue;
            }

            items.push(item_upload);
        }

        for (const item_actual of items_actual) {
            if (
                items.find(item => item.displayName === item_actual.displayName) !==
                undefined
            ) {
                continue;
            }

            if (item_actual.displayName === ".keep") {
                continue;
            }

            items.push(item_actual);
        }

        for (const item of items) {
            if (
                deletions_profile.find(({ s3Uri }) => {
                    switch (item.type) {
                        case "object":
                            if (s3Uri.type !== "object") {
                                return false;
                            }
                            return same(item.s3Uri, s3Uri);
                        case "prefix segment":
                            if (s3Uri.type !== "prefix") {
                                return false;
                            }
                            return same(item.s3UriPrefix, s3Uri);
                    }
                }) !== undefined
            ) {
                item.isDeleting = true;
            }
        }

        items.sort((a, b) => a.displayName.localeCompare(b.displayName));

        return items;
    }
);

const uploads = createSelector(state, (state): MainView["uploads"] =>
    state.uploads.filter(upload => upload.completionPercent !== 100)
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

        return {
            isErrored: false,
            items
        };
    }
);

const uriBar = createSelector(
    s3UriPrefix,
    bookmarks,
    listedPrefix,
    isListing,
    s3ProfilesManagement.selectors.ambientS3Profile,
    (
        s3UriPrefix,
        bookmarks,
        listedPrefix,
        isListing,
        ambientS3Profile
    ): MainView["uriBar"] => {
        if (s3UriPrefix === undefined) {
            return {
                s3UriPrefix: undefined,
                hints: bookmarks.map(bookmark => ({
                    type: "bookmark",
                    text: stringifyS3Uri(bookmark.s3UriPrefix)
                })),
                bookmarkStatus: {
                    isBookmarked: false
                }
            };
        }

        const bookmarkStatus: MainView["uriBar"]["bookmarkStatus"] = (() => {
            assert(ambientS3Profile !== undefined);

            const bookmark = ambientS3Profile.bookmarks.find(bookmark =>
                same(bookmark.s3UriPrefix, s3UriPrefix)
            );

            if (bookmark === undefined) {
                return { isBookmarked: false };
            }

            return {
                isBookmarked: true,
                isReadonly: bookmark.isReadonly
            };
        })();

        const s3UriPrefix_str = stringifyS3Uri(s3UriPrefix);

        const hints: MainView["uriBar"]["hints"] = bookmarks
            .map(bookmark => stringifyS3Uri(bookmark.s3UriPrefix))
            .filter(s3UriPrefix_bookmark_str =>
                s3UriPrefix_bookmark_str.startsWith(s3UriPrefix_str)
            )
            .map(s3UriPrefix_bookmark_str =>
                s3UriPrefix_bookmark_str.slice(s3UriPrefix_str.length)
            )
            .map(text => ({
                type: "bookmark" as const,
                text
            }));

        if (listedPrefix === undefined || listedPrefix.isErrored || isListing) {
            return {
                s3UriPrefix,
                hints,
                bookmarkStatus
            };
        }

        listedPrefix.items.forEach(item => {
            switch (item.type) {
                case "object":
                    hints.push({
                        type: "object",
                        text: item.s3Uri.keyBasename
                    });

                    break;

                case "prefix segment":
                    {
                        const last_segment = item.s3UriPrefix.keySegments.at(-1);
                        assert(last_segment !== undefined);

                        hints.push({
                            type: "key-segment",
                            text: last_segment
                        });
                    }
                    break;
                default:
                    assert<Equals<typeof item, never>>(false);
            }
        });

        hints.sort((a, b) => {
            const getRank = (hint: typeof a) =>
                hint.type === "key-segment" ? 0 : hint.type === "object" ? 1 : 2;
            return getRank(a) - getRank(b);
        });

        return {
            s3UriPrefix,
            hints,
            bookmarkStatus
        };
    }
);

const mainView = createSelector(
    profileSelect,
    bookmarks,
    uploads,
    uriBar,
    isListing,
    listedPrefix,
    (profileSelect, bookmarks, uploads, uriBar, isListing, listedPrefix): MainView => ({
        profileSelect,
        bookmarks,
        uploads,
        uriBar,
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

        return listedPrefix_state.next.s3UriPrefix;
    }
);

const doesListedPrefixHaveFinishedUpload = createSelector(
    listedPrefix,
    listedPrefix =>
        listedPrefix !== undefined &&
        !listedPrefix.isErrored &&
        listedPrefix.items.find(item => item.uploadProgressPercent === 100) !== undefined
);

export const privateSelectors = {
    routeParams,
    s3UriPrefix,
    profileName,
    s3UriPrefixObj_currentlyListing,
    doesListedPrefixHaveFinishedUpload
};
