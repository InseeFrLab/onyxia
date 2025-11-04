import type { Thunks } from "core/bootstrap";
import { actions, type RouteParams } from "./state";
import { protectedSelectors } from "./selectors";
import * as s3ProfilesManagement from "core/usecases/_s3Next/s3ProfilesManagement";
import { evt } from "./evt";
import type { S3PrefixUrlParsed } from "core/tools/S3PrefixUrlParsed";

export const thunks = {
    load:
        (params: { routeParams: RouteParams }) =>
        (...args): { routeParams_toSet: RouteParams | undefined } => {
            const [dispatch, getState] = args;

            const { routeParams } = params;

            if (routeParams.profile !== undefined) {
                dispatch(actions.routeParamsSet({ routeParams }));
                return { routeParams_toSet: undefined };
            }

            const isStateInitialized = protectedSelectors.isStateInitialized(getState());

            if (isStateInitialized) {
                const routeParams = protectedSelectors.routeParams(getState());
                return { routeParams_toSet: routeParams };
            }

            const s3Profiles = s3ProfilesManagement.selectors.s3Profiles(getState());

            const s3Profile =
                s3Profiles.find(s3Profile => s3Profile.origin === "defined in region") ??
                s3Profiles[0];

            if (s3Profile === undefined) {
                return {
                    routeParams_toSet: {
                        profile: undefined,
                        path: ""
                    }
                };
            }

            const routeParams_toSet: RouteParams = {
                profile: s3Profile.id,
                path: ""
            };

            dispatch(actions.routeParamsSet({ routeParams: routeParams_toSet }));

            return { routeParams_toSet };
        },
    notifyRouteParamsExternallyUpdated:
        (params: { routeParams: RouteParams }) =>
        (...args) => {
            const { routeParams } = params;
            const [dispatch] = args;
            const { routeParams_toSet } = dispatch(thunks.load({ routeParams }));

            if (routeParams_toSet !== undefined) {
                evt.post({
                    actionName: "updateRoute",
                    method: "replace",
                    routeParams: routeParams_toSet
                });
            }
        },
    updateS3Url:
        (params: { s3Url_parsed: S3PrefixUrlParsed }) =>
        (...args) => {
            const [dispatch] = args;

            const { s3Url_parsed } = params;

            dispatch(actions.s3UrlUpdated({ s3Url_parsed }));
        },
    updateSelectedS3Profile:
        (params: { s3ProfileId: string }) =>
        (...args) => {
            const [dispatch] = args;

            const { s3ProfileId } = params;

            dispatch(
                actions.selectedS3ProfileUpdated({
                    s3ProfileId
                })
            );
        }
} satisfies Thunks;
