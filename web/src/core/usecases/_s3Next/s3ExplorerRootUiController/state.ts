import { createUsecaseActions } from "clean-architecture";
import { createObjectThatThrowsIfAccessed } from "clean-architecture";

export const name = "s3ExplorerRootUiController";

export type RouteParams = {
    profile?: string;
    bucket?: string;
    prefix?: string;
};

export type State = {
    routeParams: RouteParams;
};

export const { actions, reducer } = createUsecaseActions({
    name,
    initialState: createObjectThatThrowsIfAccessed<State>(),
    reducers: {
        routeParamsSet: (
            state,
            {
                payload
            }: {
                payload: {
                    routeParams: RouteParams;
                };
            }
        ) => {
            const { routeParams } = payload;

            state.routeParams = routeParams;
        },
        locationUpdated: (
            state,
            { payload }: { payload: { bucket: string; keyPrefix: string } }
        ) => {
            const { bucket, keyPrefix } = payload;

            state.routeParams.bucket = bucket;
            state.routeParams.prefix = keyPrefix;
        },
        selectedS3ProfileUpdated: (
            state,
            { payload }: { payload: { s3ProfileId: string } }
        ) => {
            const { s3ProfileId } = payload;

            state.routeParams.profile = s3ProfileId;
            state.routeParams.bucket = undefined;
            state.routeParams.prefix = undefined;
        }
    }
});
