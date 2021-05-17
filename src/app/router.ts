
import { createRouter, defineRoute, param, noMatch } from "type-route";
import type { ValueSerializer } from "type-route";
import { id } from "tsafe/id";
import type { AccountTabId } from "app/components/pages/Account/accountTabIds";
import { accountTabIds } from "app/components/pages/Account/accountTabIds";
import URLON from "urlon";
import type { FormField } from "lib/useCases/launcher";
import { pure } from "lib/useCases/launcher";

export const { RouteProvider, useRoute, routes } = createRouter({
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
            "p": param.query.optional.ofType(id<ValueSerializer<Pick<FormField, "path" | "value">[]>>({
                "parse": raw => pure.objectToFormFieldsValue(URLON.parse(raw)),
                "stringify": formFieldsValue => URLON.stringify(pure.formFieldsValueToObject(formFieldsValue))
            })).default([])
        },
        ({ catalogId, packageName }) => `/launcher/${catalogId}/${packageName}`
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
