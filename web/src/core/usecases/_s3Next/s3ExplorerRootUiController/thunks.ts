import type { Thunks } from "core/bootstrap";
import { actions, type RouteParams } from "./state";
import { protectedSelectors } from "./selectors";
import * as s3ProfilesManagement from "core/usecases/_s3Next/s3ProfilesManagement";

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
                        bucket: undefined,
                        prefix: undefined
                    }
                };
            }

            const routeParams_toSet: RouteParams = {
                profile: s3Profile.id,
                bucket: undefined,
                prefix: undefined
            };

            dispatch(actions.routeParamsSet({ routeParams: routeParams_toSet }));

            return { routeParams_toSet };
        },
    updateLocation:
        (params: { bucket: string; keyPrefix: string }) =>
        (...args) => {
            const [dispatch] = args;

            const { bucket, keyPrefix } = params;

            dispatch(
                actions.locationUpdated({
                    bucket,
                    keyPrefix
                })
            );
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
