import { createRouter, defineRoute, param, noMatch, createGroup } from "type-route";
import type { ValueSerializer } from "type-route";
import { id } from "tsafe/id";
import { type LocalizedString, zLocalizedString } from "ui/i18n";

export const routeDefs = {
    document: defineRoute(
        {
            source: param.query.ofType(
                id<ValueSerializer<LocalizedString>>({
                    parse: str => {
                        let value: LocalizedString;

                        try {
                            value = JSON.parse(decodeURIComponent(str));
                        } catch {
                            return noMatch;
                        }

                        try {
                            zLocalizedString.parse(value);
                        } catch {
                            return noMatch;
                        }

                        return value;
                    },
                    stringify: value => encodeURIComponent(JSON.stringify(value))
                })
            )
        },
        () => `/document`
    )
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));
