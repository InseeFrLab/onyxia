import { createUsecaseActions } from "clean-architecture";
import { createObjectThatThrowsIfAccessed } from "clean-architecture";
import { S3PrefixUrlParsed } from "core/tools/S3PrefixUrlParsed";

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
            { payload }: { payload: { s3Url_parsed: S3PrefixUrlParsed } }
        ) => {
            const { s3Url_parsed } = payload;

            state.routeParams.path = S3PrefixUrlParsed.stringify(s3Url_parsed).slice(
                "s3://".length
            );
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
