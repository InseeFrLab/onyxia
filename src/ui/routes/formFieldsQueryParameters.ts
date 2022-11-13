import type { FormFieldValue } from "core/usecases/sharedDataModel/FormFieldValue";
import type { QueryStringSerializer } from "type-route";
import { arrPartition } from "evt/tools/reducers/partition";
import { assert } from "tsafe/assert";
import type { ValueSerializer, RouterOpts } from "type-route";
import { param } from "type-route";

const formFieldsValueDifferentFromDefault = "formFieldsValueDifferentFromDefault";

const formFieldsValueSerializer: ValueSerializer<FormFieldValue[]> = {
    "urlEncode": false,
    "stringify": JSON.stringify,
    "parse": JSON.parse
};

const queryStringSerializer: QueryStringSerializer = {
    "parse": raw => {
        const allEntries = raw.split("&").map(part => part.split("="));

        const [formFieldsEntries, otherEntries] = arrPartition(allEntries, ([key]) =>
            key.includes(".")
        );

        const formFieldsValue = formFieldsEntries.map(
            ([pathStr, valueStr]): FormFieldValue => ({
                "path": pathStr
                    //NOTE the two next pipe mean "split all non escaped dots"
                    //the regular expression 'look behind' is not supported by Safari.
                    .split(".")
                    .reduce<string[]>(
                        (prev, curr) =>
                            prev[prev.length - 1]?.endsWith("\\")
                                ? ((prev[prev.length - 1] += `.${curr}`), prev)
                                : [...prev, curr],
                        []
                    )
                    .map(s => s.replace(/\\\./g, ".")),
                "value": (() => {
                    if (["true", "false"].includes(valueStr)) {
                        return "true" === valueStr;
                    }

                    {
                        const x = parseFloat(valueStr);
                        if (!isNaN(x)) {
                            return x;
                        }
                    }

                    const decodedValue = decodeURIComponent(valueStr);

                    {
                        const str = decodedValue.replace(/^«/, "").replace(/»$/, "");

                        if (str !== decodedValue) {
                            return str;
                        }
                    }

                    const object = JSON.parse(decodeURIComponent(decodedValue));

                    assert(object instanceof Object);

                    return object;
                })()
            })
        );

        return Object.fromEntries([
            ...otherEntries,
            [
                formFieldsValueDifferentFromDefault,
                formFieldsValueSerializer.stringify(formFieldsValue)
            ]
        ]);
    },
    "stringify": queryParams =>
        Object.keys(queryParams)
            .map(name => {
                if (name === formFieldsValueDifferentFromDefault) {
                    const formFieldsValue = formFieldsValueSerializer.parse(
                        queryParams[name].value!
                    );

                    assert(!("__noMatch" in formFieldsValue));

                    return formFieldsValue
                        .map(({ path, value }) =>
                            [
                                path.map(part => part.replace(/\./g, "\\.")).join("."),
                                (() => {
                                    switch (typeof value) {
                                        case "boolean":
                                            return value ? "true" : "false";
                                        case "number":
                                            return value.toString(10);
                                        case "string":
                                            return `«${encodeURIComponent(value)}»`;
                                        case "object":
                                            return encodeURIComponent(
                                                JSON.stringify(value)
                                            );
                                        default:
                                            assert(false);
                                    }
                                })()
                            ].join("=")
                        )
                        .join("&");
                }

                return `${name}=${queryParams[name].value}`;
            })
            .filter(part => part !== "")
            .join("&")
};

export const routerOpts: RouterOpts = { queryStringSerializer };

export const formFieldsDefineRouteParam = {
    [formFieldsValueDifferentFromDefault]: param.query.optional
        .ofType(formFieldsValueSerializer)
        .default([])
};
