import "minimal-polyfills/Object.fromEntries";
import { createRouter, defineRoute, param, createGroup, type Route } from "type-route";
import type { QueryStringSerializer } from "type-route";
import { partition } from "evt/tools/reducers/partition";
import { assert, type Equals } from "tsafe/assert";
import type { ValueSerializer } from "type-route";
import { StringifyableAtomic } from "core/tools/Stringifyable";

const { helmValuesPatchWrap, queryStringSerializer } = (() => {
    const helmValuesPatch_key = "helmValuesPatch";

    type HelmValuesPatchEntry = {
        path: (string | number)[];
        value: StringifyableAtomic | undefined;
    };

    const helmValuesPatchSerializer: ValueSerializer<HelmValuesPatchEntry[]> = {
        urlEncode: false,
        stringify: JSON.stringify,
        parse: JSON.parse
    };

    const queryStringSerializer = {
        parse: raw => {
            const [queryParamsEntries_helmValuesPatch, queryParamsEntries_other] = raw
                .split("&")
                .map(part => {
                    const [queryParamKey, queryParamValue, ...rest] = part.split("=");
                    assert(rest.length === 0);
                    return [queryParamKey, queryParamValue] as const;
                })
                .reduce(
                    ...partition<readonly [string, string]>(
                        ([queryParamKey]) =>
                            queryParamKey.includes(".") &&
                            !queryParamKey.startsWith("oidc-spa.")
                    )
                );

            console.log({ queryParamsEntries_helmValuesPatch, queryParamsEntries_other });

            const helmValuesPatch = queryParamsEntries_helmValuesPatch.map(
                ([queryParamKey, queryParamValue]): HelmValuesPatchEntry => ({
                    path: (() => {
                        const escapedDotsPlaceholder =
                            "escapedDotsPlaceholder_xKdMzIdVmT";
                        const arrayIndexPrefix = "arrayIndexPrefix_xKdMzIdVmT_";

                        return queryParamKey
                            .replace(/\\\./g, escapedDotsPlaceholder)
                            .replace(
                                /\[(\d+)\]/g,
                                (...[, x]) => `.${arrayIndexPrefix}${x}`
                            )
                            .split(".")
                            .filter((s, i, arr) =>
                                i === arr.length - 1 && s === "" ? false : true
                            )
                            .map(s =>
                                s.startsWith(arrayIndexPrefix)
                                    ? parseInt(s.slice(arrayIndexPrefix.length), 10)
                                    : s.replace(
                                          new RegExp(escapedDotsPlaceholder, "g"),
                                          "."
                                      )
                            );
                    })(),
                    value: (() => {
                        if (["true", "false"].includes(queryParamValue)) {
                            return "true" === queryParamValue;
                        }

                        if (queryParamValue === "null") {
                            return null;
                        }

                        if (queryParamValue === "-") {
                            return undefined;
                        }

                        {
                            const x = parseFloat(queryParamValue);
                            if (!isNaN(x)) {
                                return x;
                            }
                        }

                        const match =
                            decodeURIComponent(queryParamValue).match(/^«([^»]*)»$/);

                        assert(match !== null);

                        return match[1];
                    })()
                })
            );

            return Object.fromEntries([
                ...queryParamsEntries_other,
                [
                    helmValuesPatch_key,
                    helmValuesPatchSerializer.stringify(helmValuesPatch)
                ]
            ]);
        },
        stringify: queryParams =>
            Object.keys(queryParams)
                .map(queryParamKey => {
                    if (queryParamKey === helmValuesPatch_key) {
                        const serializedHelmValuesPatch =
                            queryParams[queryParamKey].value;

                        assert(serializedHelmValuesPatch !== null);

                        const helmValuesPatch = helmValuesPatchSerializer.parse(
                            serializedHelmValuesPatch
                        );

                        assert(!("__noMatch" in helmValuesPatch));

                        return helmValuesPatch.map(({ path, value }) =>
                            [
                                path
                                    .map(part =>
                                        typeof part === "number"
                                            ? part
                                            : part.replace(/\./g, "\\.")
                                    )
                                    .reduce<string>((prev, curr) => {
                                        if (typeof curr === "number") {
                                            assert(prev !== "");
                                            return `${prev}[${curr}]`;
                                        }

                                        return prev === "" ? curr : `${prev}.${curr}`;
                                    }, ""),
                                (() => {
                                    if (value === null) {
                                        return "null";
                                    }

                                    if (value === undefined) {
                                        return "-";
                                    }

                                    switch (typeof value) {
                                        case "boolean":
                                            return value ? "true" : "false";
                                        case "number":
                                            return `${value}`;
                                        case "string":
                                            return `«${encodeURIComponent(value)}»`;
                                    }

                                    assert<Equals<typeof value, never>>(false);
                                })()
                            ].join("=")
                        );
                    }

                    return [`${queryParamKey}=${queryParams[queryParamKey].value}`];
                })
                .flat()
                .join("&")
    } satisfies QueryStringSerializer;

    const helmValuesPatchWrap = {
        [helmValuesPatch_key]: param.query.optional
            .ofType(helmValuesPatchSerializer)
            .default([])
    };

    return { helmValuesPatchWrap, queryStringSerializer };
})();

export { queryStringSerializer };

export const routeDefs = {
    launcher: defineRoute(
        {
            catalogId: param.path.string,
            chartName: param.path.string,
            name: param.query.optional.string,
            shared: param.query.optional.boolean,
            version: param.query.optional.string,
            s3: param.query.optional.string,
            ...helmValuesPatchWrap,
            autoLaunch: param.query.optional.boolean
        },
        ({ catalogId, chartName }) => `/launcher/${catalogId}/${chartName}`
    )
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));

export type PageRoute = Route<typeof routeGroup>;

export const getDoRequireUserLoggedIn: (route: PageRoute) => boolean = () => true;
