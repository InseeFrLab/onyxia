import { id } from "tsafe";
import {
    createRouter,
    defineRoute,
    createGroup,
    param,
    type Route,
    type ValueSerializer,
    noMatch
} from "type-route";
import { ViewMode, viewModes } from "./shared/types";

export const routeDefs = {
    myFiles: defineRoute(
        {
            path: param.path.trailing.optional.ofType({
                parse: raw => decodeURIComponent(raw), // decode the path
                stringify: value => encodeURI(value) // encode when creating URL
            }),
            openFile: param.query.optional.string,
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
        ({ path }) => `/my-files/${path}`
    )
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));

export type PageRoute = Route<typeof routeGroup>;
