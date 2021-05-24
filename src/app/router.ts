import "minimal-polyfills/Object.fromEntries";
import { createRouter, defineRoute, param, noMatch } from "type-route";
import type { ValueSerializer } from "type-route";
import { id } from "tsafe/id";
import type { AccountTabId } from "app/components/pages/Account/accountTabIds";
import { accountTabIds } from "app/components/pages/Account/accountTabIds";
import type { FormFieldValue } from "lib/useCases/sharedDataModel/FormFieldValue";
import type { QueryStringSerializer } from "type-route";
import { arrPartition } from "evt/tools/reducers/partition";
import { assert } from "tsafe/assert";

const formFieldsValueDifferentFromDefault = "formFieldsValueDifferentFromDefault";

const formFieldsValueSerializer: ValueSerializer<FormFieldValue[]> = {
    "urlEncode": false,
    "stringify": JSON.stringify,
    "parse": JSON.parse
};

const queryStringSerializer: QueryStringSerializer = {
    "parse": raw => {

        const allEntries =
            raw.split("&")
                .map(part => part.split("="));

        const [formFieldsEntries, otherEntries] = arrPartition(
            allEntries,
            ([key]) => key.includes(".")
        );

        const formFieldsValue =
            formFieldsEntries
                .map(([pathStr, valueStr]): FormFieldValue => ({
                    "path":
                        pathStr
                            //NOTE the two next pipe mean "split all non escaped dots"
                            //the regular expression 'look behind' is not supported by Safari.
                            .split(".")
                            .reduce<string[]>((prev, curr) =>
                                prev[prev.length - 1]?.endsWith("\\") ?
                                    (prev[prev.length - 1] += `.${curr}`, prev) :
                                    [...prev, curr],
                                []
                            )
                            .map(s => s.replace(/\\\./g, ".")),
                    "value": (()=>{

                        if( ["true", "false"].includes(valueStr) ){
                            return "true" === valueStr;
                        }

                        {
                            const x = parseFloat(valueStr);
                            if( !isNaN(x) ){
                                return x;
                            }
                        }

                        return decodeURIComponent( valueStr)
                            .replace(/^«/, "")
                            .replace(/»$/, "");

                    })()
                    
                }));

        return Object.fromEntries(
            [
                ...otherEntries,
                [
                    formFieldsValueDifferentFromDefault,
                    formFieldsValueSerializer.stringify(formFieldsValue)
                ]
            ]
        );

    },
    "stringify": queryParams =>
        Object.keys(queryParams)
            .map(name => {

                if (name === formFieldsValueDifferentFromDefault) {

                    const formFieldsValue = formFieldsValueSerializer.parse(queryParams[name].value!);

                    assert(!("__noMatch" in formFieldsValue));

                    return formFieldsValue
                        .map(
                            ({ path, value }) => [
                                path
                                    .map(part => part.replace(/\./g, "\\."))
                                    .join("."),
                                (() => {
                                    switch (typeof value) {
                                        case "boolean": return value ? "true" : "false";
                                        case "number": return value.toString(10);
                                        case "string": return `«${encodeURIComponent(value)}»`;
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
}

//const config: RouterOpts = { queryStringSerializer };

export const { RouteProvider, useRoute, routes } = createRouter({ queryStringSerializer }, {
    "account": defineRoute(
        {
            "tabId": param.path.optional.ofType(id<ValueSerializer<AccountTabId>>({
                "parse": raw => !id<readonly string[]>(accountTabIds).includes(raw) ? noMatch : raw as AccountTabId,
                "stringify": value => value
            })).default(accountTabIds[0])
        },
        ({ tabId }) => `/account/${tabId}`
    ),
    "home": defineRoute(["/home", "/"]),
    "tour": defineRoute("/visite-guidee"),
    ...(() => {

        const sharedServices = defineRoute("/services");

        return {
            sharedServices,
            "sharedServicesDetails": sharedServices.extend(
                { "serviceId": param.path.string },
                ({ serviceId }) => `/${serviceId}`
            )
        };

    })(),
    "trainings": defineRoute(
        { "courseCode": param.path.optional.string },
        ({ courseCode }) => `/trainings/${courseCode}`
    ),
    //TODO: Remove, legacy
    "catalog": defineRoute(
        { "optionalTrailingPath": param.path.trailing.optional.string },
        ({ optionalTrailingPath }) => `/my-lab/catalogue/${optionalTrailingPath}`
    ),
    "catalogExplorer": defineRoute(
        { "catalogId": param.path.optional.string },
        ({ catalogId }) => `/catalog/${catalogId}`
    ),
    "catalogLauncher": defineRoute(
        {
            "catalogId": param.path.string,
            "packageName": param.path.string,
            [formFieldsValueDifferentFromDefault]: param.query.optional.ofType(formFieldsValueSerializer).default([])
        },
        ({ catalogId, packageName }) => `/x/${catalogId}/${packageName}`
    ),
    ...(() => {

        const myServices = defineRoute("/my-service");

        return {
            myServices,
            "myService": myServices.extend(
                { "serviceId": param.path.string },
                ({ serviceId }) => `/${serviceId}`
            )
        };

    })(),
    "mySecrets": defineRoute(
        {
            "secretOrDirectoryPath": param.path.trailing.optional.string,
            "isFile": param.query.optional.boolean
        },
        ({ secretOrDirectoryPath }) => `/my-secrets/${secretOrDirectoryPath}`
    ),
    ...(() => {

        const myBuckets = defineRoute("/mes-fichiers");

        return {
            myBuckets,
            "myFiles": myBuckets.extend(
                {
                    "bucketName": param.path.string,
                    "fileOrDirectoryPath": param.path.trailing.optional.string
                },
                ({ bucketName, fileOrDirectoryPath }) => `/${bucketName}/${fileOrDirectoryPath}`
            )
        };


    })()
});
