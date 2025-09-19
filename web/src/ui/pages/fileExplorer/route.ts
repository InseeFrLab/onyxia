import { id } from "tsafe";
import {
    defineRoute,
    createGroup,
    param,
    type ValueSerializer,
    noMatch
} from "type-route";
import { type ViewMode, viewModes } from "./shared/types";

export const routeDefs = {
    myFiles: defineRoute(
        {
            path: param.path.trailing.ofType({
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
        ({ path }) => [`/file-explorer/${path}`, `/my-files/${path}`]
    )
};

export const routeGroup = createGroup(routeDefs);
