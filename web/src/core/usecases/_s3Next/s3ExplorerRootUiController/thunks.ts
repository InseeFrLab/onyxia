import type { Thunks } from "core/bootstrap";
import { protectedSelectors } from "./selectors";
import * as s3ProfilesManagement from "core/usecases/_s3Next/s3ProfilesManagement";
import * as fileExplorer from "core/usecases/fileExplorer";
import type { RouteParams } from "./selectors";
import { evt } from "./evt";
import { parseS3UriPrefix } from "core/tools/S3Uri";
import { assert } from "tsafe/assert";

export const thunks = {
    load:
        (params: { routeParams: RouteParams }) =>
        async (...args): Promise<{ routeParams_toSet: RouteParams | undefined }> => {
            const [dispatch, getState] = args;

            const { routeParams } = params;

            if (routeParams.profile !== undefined) {
                const { doesProfileExist } = dispatch(
                    s3ProfilesManagement.protectedThunks.changeAmbientProfile({
                        profileName: routeParams.profile
                    })
                );

                if (!doesProfileExist) {
                    return dispatch(thunks.load({ routeParams: { path: "" } }));
                }

                fileExplorer.thunks.setS3UriPrefixObjAndNavigate({
                    s3UriPrefixObj: parseS3UriPrefix({
                        s3UriPrefix: routeParams.path,
                        strict: false
                    })
                });

                return { routeParams_toSet: undefined };
            }

            return {
                routeParams_toSet: protectedSelectors.routeParams(getState())
            };
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
    updateSelectedS3Profile:
        (params: { profileName: string }) =>
        async (...args) => {
            const [dispatch] = args;

            const { profileName } = params;

            const { doesProfileExist } = dispatch(
                s3ProfilesManagement.protectedThunks.changeAmbientProfile({
                    profileName
                })
            );

            assert(doesProfileExist);
        }
    /*
    toggleIsDirectoryPathBookmarked: (() => {
        let isRunning = false;

        return () =>
            async (...args) => {
                if (isRunning) {
                    return;
                }

                isRunning = true;

                const [dispatch, getState] = args;

                const { selectedS3ProfileName, s3UriPrefixObj, bookmarkStatus } =
                    selectors.view(getState());

                assert(selectedS3ProfileName !== undefined);
                assert(s3UriPrefixObj !== undefined);

                await dispatch(
                    s3ProfilesManagement.protectedThunks.createDeleteOrUpdateBookmark({
                        profileName: selectedS3ProfileName,
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
            */
} satisfies Thunks;
