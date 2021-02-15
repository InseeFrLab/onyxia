
import { createRouter, defineRoute, param } from "type-route";


export const { RouteProvider, useRoute, routes } = createRouter({
    "home": defineRoute(["/home", "/"]),
    "account": defineRoute("/account"),
    "catalog": defineRoute(
        { "optionalTrailingPath": param.path.trailing.optional.string },
        ({ optionalTrailingPath }) => `/my-lab/catalogue/${optionalTrailingPath}`
    ),
    "myServices": defineRoute(
        { "serviceId": param.path.optional.string },
        ({ serviceId }) => `/my-service/${serviceId}`
    ),

    "mySecrets": defineRoute(
        { "directoryPath": param.path.trailing.optional.string },
        ({ directoryPath }) => `/my-secrets/${directoryPath}`
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
