import type { State as RootState } from "core/bootstrap";
import { name } from "./state";
import { isObjectThatThrowIfAccessed, createSelector } from "clean-architecture";
import { assert } from "tsafe";
import * as s3ProfilesManagement from "core/usecases/_s3Next/s3ProfilesManagement";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import { S3PrefixUrlParsed } from "core/tools/S3PrefixUrlParsed";

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
        bucket: string;
        keyPrefix: string;
    }[];
    s3Url_parsed: S3PrefixUrlParsed | undefined;
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
                s3Url_parsed: undefined
            };
        }

        const selectedS3ProfileId = routeParams.profile;

        const s3Profile = s3Profiles.find(
            s3Profile => s3Profile.id === selectedS3ProfileId
        );

        assert(s3Profile !== undefined);

        return {
            selectedS3ProfileId,
            availableS3Profiles: s3Profiles.map(s3Profile => ({
                id: s3Profile.id,
                displayName: s3Profile.paramsOfCreateS3Client.url
            })),
            bookmarks: s3Profile.bookmarks,
            s3Url_parsed:
                routeParams.path === ""
                    ? undefined
                    : S3PrefixUrlParsed.parse(`s3://${routeParams.path}`)
        };
    }
);

export const selectors = { view };
