
import { createRouter, defineRoute, param, noMatch } from "type-route";
import type { ValueSerializer } from "type-route";
import { id } from "tsafe/id";
import type { AccountTabId } from "app/components/pages/Account/accountTabIds";
import { accountTabIds } from "app/components/pages/Account/accountTabIds";
import URLON from "urlon";





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
            "serviceId": param.path.string,
            "params": param.query.optional.ofType(id<ValueSerializer<Record<string, string>>>({
                "parse": raw => URLON.parse(raw),
                "stringify": value => URLON.stringify(value)
            })).default({})
        },
        ({ catalogId, serviceId }) => `/launcher/${catalogId}/${serviceId}`
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
