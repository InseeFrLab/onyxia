import type { Thunks } from "core/bootstrap";
import { actions, type RouteParams } from "./state";
import { protectedSelectors } from "./selectors";
import * as s3ProfilesManagement from "core/usecases/_s3Next/s3ProfilesManagement";
import { selectors } from "./selectors";
import { evt } from "./evt";
import type { S3UriPrefixObj } from "core/tools/S3Uri";
import { assert } from "tsafe/assert";

export const thunks = {
    load:
        (params: { routeParams: RouteParams }) =>
        async (...args): Promise<{ routeParams_toSet: RouteParams | undefined }> => {
            const [dispatch, getState] = args;

            const { routeParams } = params;

            if (routeParams.profile !== undefined) {
                const profileName = routeParams.profile;

                {
                    const s3Profiles =
                        s3ProfilesManagement.selectors.s3Profiles(getState());

                    if (
                        s3Profiles.find(
                            s3Profile => s3Profile.profileName === profileName
                        ) === undefined
                    ) {
                        return dispatch(thunks.load({ routeParams: { path: "" } }));
                    }
                }

                await dispatch(
                    s3ProfilesManagement.protectedThunks.changeIsDefault({
                        profileName,
                        usecase: "explorer",
                        value: true
                    })
                );

                dispatch(actions.routeParamsSet({ routeParams }));
                return { routeParams_toSet: undefined };
            }

            const isStateInitialized = protectedSelectors.isStateInitialized(getState());

            if (isStateInitialized) {
                const routeParams = protectedSelectors.routeParams(getState());
                return { routeParams_toSet: routeParams };
            }

            const { s3Profile } =
                (await dispatch(
                    s3ProfilesManagement.protectedThunks.getS3ProfileAndClientForExplorer()
                )) ?? {};

            console.log(s3Profile);

            const routeParams_toSet: RouteParams = {
                profile: s3Profile === undefined ? undefined : s3Profile.profileName,
                path: ""
            };

            dispatch(actions.routeParamsSet({ routeParams: routeParams_toSet }));

            return { routeParams_toSet };
        },
    notifyRouteParamsExternallyUpdated:
        (params: { routeParams: RouteParams }) =>
        async (...args) => {
            const { routeParams } = params;
            const [dispatch] = args;
            const { routeParams_toSet } = await dispatch(thunks.load({ routeParams }));

            if (routeParams_toSet !== undefined) {
                evt.post({
                    actionName: "updateRoute",
                    method: "replace",
                    routeParams: routeParams_toSet
                });
            }
        },
    updateS3Url:
        (params: { s3UriPrefixObj: S3UriPrefixObj | undefined }) =>
        (...args) => {
            const [dispatch] = args;

            const { s3UriPrefixObj } = params;

            dispatch(actions.s3UrlUpdated({ s3UriPrefixObj }));
        },
    updateSelectedS3Profile:
        (params: { profileName: string }) =>
        async (...args) => {
            const [dispatch] = args;

            const { profileName } = params;

            await dispatch(
                s3ProfilesManagement.protectedThunks.changeIsDefault({
                    profileName,
                    usecase: "explorer",
                    value: true
                })
            );

            dispatch(
                actions.selectedS3ProfileUpdated({
                    profileName
                })
            );
        },
    toggleIsDirectoryPathBookmarked: (() => {
        let isRunning = false;

        return () =>
            async (...args) => {
                if (isRunning) {
                    return;
                }

                isRunning = true;

                const [dispatch, getState] = args;

                const { selectedProfileName, s3UriPrefixObj, bookmarkStatus } =
                    selectors.view(getState());

                assert(selectedProfileName !== undefined);
                assert(s3UriPrefixObj !== undefined);

                await dispatch(
                    s3ProfilesManagement.protectedThunks.createDeleteOrUpdateBookmark({
                        profileName: selectedProfileName,
                        s3UriPrefixObj,
                        action: bookmarkStatus.isBookmarked
                            ? {
                                  type: "delete"
                              }
                            : {
                                  type: "create or update",
                                  displayName: undefined
                              }
                    })
                );

                isRunning = false;
            };
    })()
} satisfies Thunks;
