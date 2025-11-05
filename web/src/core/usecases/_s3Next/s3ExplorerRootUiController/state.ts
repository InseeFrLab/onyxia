import { createUsecaseActions } from "clean-architecture";
import { createObjectThatThrowsIfAccessed } from "clean-architecture";
import { type S3UriPrefixObj, stringifyS3UriPrefixObj } from "core/tools/S3Uri";

export const name = "s3ExplorerRootUiController";

export type RouteParams = {
    profile?: string;
    path: string;
};

export type State = {
    routeParams: RouteParams;
};

export const { actions, reducer } = createUsecaseActions({
    name,
    initialState: createObjectThatThrowsIfAccessed<State>(),
    reducers: {
        routeParamsSet: (
            _state,
            {
                payload
            }: {
                payload: {
                    routeParams: RouteParams;
                };
            }
        ) => {
            const { routeParams } = payload;

            return { routeParams };
        },
        s3UrlUpdated: (
            state,
            { payload }: { payload: { s3UriPrefixObj: S3UriPrefixObj | undefined } }
        ) => {
            const { s3UriPrefixObj } = payload;

            state.routeParams.path =
                s3UriPrefixObj === undefined
                    ? ""
                    : stringifyS3UriPrefixObj(s3UriPrefixObj).slice("s3://".length);
        },
        selectedS3ProfileUpdated: (
            state,
            { payload }: { payload: { s3ProfileId: string } }
        ) => {
            const { s3ProfileId } = payload;

            state.routeParams.profile = s3ProfileId;
            state.routeParams.path = "";
        }
    }
});
