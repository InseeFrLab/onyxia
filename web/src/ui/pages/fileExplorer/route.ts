import { id } from "tsafe/id";
import {
    createRouter,
    defineRoute,
    createGroup,
    param,
    type Route,
    type ValueSerializer,
    noMatch
} from "type-route";
import { type ViewMode, viewModes } from "../myFiles/shared/types";

export const routeDefs = {
    fileExplorer: defineRoute(
        {
            path: param.path.trailing.optional.ofType({
                parse: raw => decodeURIComponent(raw), // decode the path
                stringify: value => encodeURI(value) // encode when creating URL
            }),
            mode: param.query.optional
                .ofType(
                    id<ValueSerializer<ViewMode>>({
                        parse: raw =>
                            !id<readonly string[]>(viewModes).includes(raw)
                                ? noMatch
                                : (raw as ViewMode),
                        stringify: value => value
                    })
                )
                .default(viewModes[0])
        },
        ({ path }) => `/file-explorer/${path}`
    )
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));

export type PageRoute = Route<typeof routeGroup>;
