import * as Minio from "minio";
import memoize from "memoizee";
import { getValidatedEnv } from "js/validatedEnv";
//import { prKeycloakClient } from "core/setup";

/** We avoid importing app right away to prevent require cycles */
const getS3Client = memoize(
    () => import("core/secondaryAdapters/minioS3Client").then(ns => ns.prS3Client),
    {
        "promise": true,
    },
);

export async function getMinioToken() {
    const { actions } = await import("js/redux/legacyActions");
    const store = await import("core/setup").then(({ prStore }) => prStore);

    const { s3 } = store.getState().user;

    if (
        s3 &&
        Date.parse(s3.AWS_EXPIRATION) - Date.now() >=
            getValidatedEnv().MINIO.MINIMUM_DURATION
    ) {
        return {
            "accessKey": s3.AWS_ACCESS_KEY_ID,
            "secretAccessKey": s3.AWS_SECRET_ACCESS_KEY,
            "sessionToken": s3.AWS_SESSION_TOKEN,
            "expiration": s3.AWS_EXPIRATION,
        };
    }

    const token = await (await getS3Client()).getToken({ "bucketName": undefined });

    const credentials = {
        "accessKey": token.accessKeyId,
        "expiration": "",
        "secretAccessKey": token.secretAccessKey,
        "sessionToken": token.sessionToken,
    };

    store.dispatch(actions.newS3Credentials(credentials));

    return credentials;
}

/** Get an instance of Minio.Client, only instantiated the first time */
export const getMinioClient = memoize(
    async () => {
        const credentials = await getMinioToken();

        return new Minio.Client({
            "endPoint": getValidatedEnv().MINIO.END_POINT,
            "port": getValidatedEnv().MINIO.PORT,
            "useSSL": true,
            "accessKey": credentials.accessKey,
            "secretKey": credentials.secretAccessKey,
            "sessionToken": credentials.sessionToken,
        });
    },
    { "promise": true },
);
