import { createSelector } from "clean-architecture";
import * as s3ProfilesManagement from "core/usecases/_s3Next/s3ProfilesManagement";
import * as fileExplorer from "core/usecases/fileExplorer";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import { type S3UriPrefixObj, stringifyS3UriPrefixObj } from "core/tools/S3Uri";

export type RouteParams = {
    profile?: string;
    path: string;
};

export const protectedSelectors = {
    routeParams: createSelector(
        createSelector(
            s3ProfilesManagement.protectedSelectors.ambientS3Profile,
            ambientS3Profile => ambientS3Profile?.profileName
        ),
        fileExplorer.selectors.s3UriPrefixObj,
        (profileName, s3UriPrefixObj): RouteParams => ({
            profile: profileName,
            path:
                s3UriPrefixObj === undefined
                    ? ""
                    : stringifyS3UriPrefixObj(s3UriPrefixObj).slice("s3://".length)
        })
    )
};

export type View = {
    selectedS3ProfileName: string | undefined;
    isSelectedS3ProfileEditable: boolean;
    isS3ProfileSelectionLocked: boolean;
    availableS3ProfileNames: string[];
    bookmarks: {
        displayName: LocalizedString | undefined;
        s3UriPrefixObj: S3UriPrefixObj;
    }[];
    shouldRenderExplorer: boolean;
};

const view = createSelector(
    s3ProfilesManagement.protectedSelectors.ambientS3Profile,
    s3ProfilesManagement.selectors.s3Profiles,
    fileExplorer.selectors.s3UriPrefixObj,
    fileExplorer.protectedSelectors.isBusy,
    (ambientS3Profile, s3Profiles, s3UriPrefixObj, isFileExplorerBusy): View => {
        if (ambientS3Profile === undefined) {
            return {
                selectedS3ProfileName: undefined,
                isSelectedS3ProfileEditable: false,
                isS3ProfileSelectionLocked: false,
                availableS3ProfileNames: [],
                bookmarks: [],
                shouldRenderExplorer: false
            };
        }

        return {
            selectedS3ProfileName: ambientS3Profile.profileName,
            isSelectedS3ProfileEditable:
                ambientS3Profile.origin === "created by user (or group project member)",
            isS3ProfileSelectionLocked: isFileExplorerBusy,
            availableS3ProfileNames: s3Profiles.map(s3Profile => s3Profile.profileName),
            bookmarks: ambientS3Profile.bookmarks,
            shouldRenderExplorer: s3UriPrefixObj !== undefined
        };
    }
);

export const selectors = { view };
