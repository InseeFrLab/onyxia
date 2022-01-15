import axios from "axios";
import type { Param0, ReturnType } from "tsafe";
import { createKeycloakOidcClient } from "./keycloakOidcClient";
import { S3Client } from "../ports/S3Client";
import { getNewlyRequestedOrCachedTokenFactory } from "core/tools/getNewlyRequestedOrCachedToken";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import { Deferred } from "evt/tools/Deferred";
import * as Minio from "minio";
import { parseUrl } from "core/tools/parseUrl";
import memoize from "memoizee";
import type { ApiLogger } from "core/tools/apiLogger";
import { join as pathJoin } from "path";

export async function createMinioS3Client(params: {
    url: string;
    keycloakParams: Param0<typeof createKeycloakOidcClient>;
}): Promise<S3Client> {
    const { url, keycloakParams } = params;

    const oidcClient = await createKeycloakOidcClient(keycloakParams);

    if (!oidcClient.isUserLoggedIn) {
        return oidcClient.login();
    }

    const { getAccessToken } = oidcClient;

    const { getNewlyRequestedOrCachedToken } = getNewlyRequestedOrCachedTokenFactory({
        "requestNewToken": async (bucketName: string | undefined) => {
            const now = Date.now();

            const { data } = await axios.create({ "baseURL": url }).post<string>(
                "/?" +
                    Object.entries({
                        "Action": "AssumeRoleWithClientGrants",
                        "Token": await getAccessToken(),
                        //Desired TTL of the token, depending of the configuration
                        //and version of minio we could get less than that but never more.
                        "DurationSeconds": 7 * 24 * 3600,
                        "Version": "2011-06-15",
                        ...(bucketName === undefined
                            ? {}
                            : {
                                  "Policy": JSON.stringify({
                                      "Version": "2012-10-17",
                                      "Statement": [
                                          {
                                              "Effect": "Allow",
                                              "Action": ["s3:*"],
                                              "Resource": [
                                                  `arn:aws:s3:::${bucketName}`,
                                                  `arn:aws:s3:::${bucketName}/*`,
                                              ],
                                          },
                                          {
                                              "Effect": "Allow",
                                              "Action": ["s3:ListBucket"],
                                              "Resource": ["arn:aws:s3:::*"],
                                              "Condition": {
                                                  "StringLike": {
                                                      "s3:prefix": "diffusion/*",
                                                  },
                                              },
                                          },
                                          {
                                              "Effect": "Allow",
                                              "Action": ["s3:GetObject"],
                                              "Resource": ["arn:aws:s3:::*/diffusion/*"],
                                          },
                                      ],
                                  }),
                              }),
                    })
                        .map(([key, value]) => `${key}=${value}`)
                        .join("&"),
            );

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "text/xml");
            const root = xmlDoc.getElementsByTagName(
                "AssumeRoleWithClientGrantsResponse",
            )[0];

            const credentials = root.getElementsByTagName("Credentials")[0];
            const accessKeyId =
                credentials.getElementsByTagName("AccessKeyId")[0].childNodes[0]
                    .nodeValue;
            const secretAccessKey =
                credentials.getElementsByTagName("SecretAccessKey")[0].childNodes[0]
                    .nodeValue;
            const sessionToken =
                credentials.getElementsByTagName("SessionToken")[0].childNodes[0]
                    .nodeValue;
            const expiration =
                credentials.getElementsByTagName("Expiration")[0].childNodes[0].nodeValue;

            assert(
                accessKeyId !== null &&
                    secretAccessKey !== null &&
                    sessionToken !== null &&
                    expiration !== null,
            );

            return id<ReturnType<S3Client["getToken"]>>({
                accessKeyId,
                "expirationTime": new Date(expiration).getTime(),
                secretAccessKey,
                sessionToken,
                "acquisitionTime": now,
            });
        },
        "returnCachedTokenIfStillValidForXPercentOfItsTTL": "90%",
    });

    const { getMinioClient } = (() => {
        const getMinioClientForToken = memoize(
            (tokenObj: ReturnType<S3Client["getToken"]>) => {
                const { accessKeyId, secretAccessKey, sessionToken } = tokenObj;

                const { host, port = 443 } = parseUrl(url);

                const minioClient = new Minio.Client({
                    "endPoint": host,
                    "port": port ?? 443,
                    "useSSL": port !== 80,
                    "accessKey": accessKeyId,
                    "secretKey": secretAccessKey,
                    sessionToken,
                });

                return { minioClient };
            },
            { "max": 1 },
        );

        async function getMinioClient(params: { bucketName: string | undefined }) {
            const { bucketName } = params;
            return getMinioClientForToken(
                await getNewlyRequestedOrCachedToken(bucketName),
            );
        }

        return { getMinioClient };
    })();

    const secretsManagerClient: S3Client = {
        "getToken": ({ bucketName }) => getNewlyRequestedOrCachedToken(bucketName),
        "list": async ({ path }) => {
            const { bucketName, prefix } = (() => {
                const [bucketName, ...rest] = path.split("/");

                return {
                    bucketName,
                    "prefix": rest.join("/"),
                };
            })();

            const { minioClient } = await getMinioClient({ bucketName });

            const stream = minioClient.listObjects(bucketName, prefix, false);

            const out: ReturnType<S3Client["list"]> = {
                "directories": [],
                "files": [],
            };

            stream.once("end", () => dOut.resolve(out));
            stream.on("data", bucketItem => {
                if (bucketItem.prefix) {
                    out.directories.push(bucketItem.prefix.replace(/\/+$/, ""));
                } else {
                    out.files.push(bucketItem.name);
                }
            });

            const dOut = new Deferred<typeof out>();

            return dOut.pr;
        },
    };

    dS3Client.resolve(secretsManagerClient);

    return secretsManagerClient;
}

const dS3Client = new Deferred<S3Client>();

/** @deprecated */
export const { pr: prS3Client } = dS3Client;

export const s3ApiLogger: ApiLogger<S3Client> = {
    "initialHistory": [],
    "methods": {
        //TODO, this is dummy
        "list": {
            "buildCmd": ({ path }) => `mc list ${pathJoin(path)}`,
            "fmtResult": ({ result: { directories, files } }) =>
                [
                    "Keys",
                    "----",
                    ...[...directories.map(directory => `${directory}/`), ...files],
                ].join("\n"),
        },
        "getToken": {
            "buildCmd": () =>
                [
                    `# We generate a token`,
                    `# See https://docs.min.io/docs/minio-sts-quickstart-guide.html`,
                ].join("\n"),
            "fmtResult": ({ result }) => `The token we got is ${JSON.stringify(result)}`,
        },
    },
};
