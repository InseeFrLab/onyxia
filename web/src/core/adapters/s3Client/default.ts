import axios from "axios";
import type * as Minio from "minio";
import type { ReturnType } from "tsafe";
import { S3Client } from "core/ports/S3Client";
import {
    getNewlyRequestedOrCachedTokenFactory,
    type TokenPersistance
} from "core/tools/getNewlyRequestedOrCachedToken";
import { assert } from "tsafe/assert";
import { Deferred } from "evt/tools/Deferred";
import { parseUrl } from "core/tools/parseUrl";
import fileReaderStream from "filereader-stream";
import type { Oidc } from "core/ports/Oidc";
import { addParamToUrl } from "powerhooks/tools/urlSearchParams";
import { bucketNameAndObjectNameFromS3Path } from "./utils/bucketNameAndObjectNameFromS3Path";
import { exclude } from "tsafe/exclude";

export type ParamsOfCreateS3Client =
    | ParamsOfCreateS3Client.NoSts
    | ParamsOfCreateS3Client.Sts;

export namespace ParamsOfCreateS3Client {
    export type Common = {
        url: string;
        pathStyleAccess: boolean;
    };

    export type NoSts = Common & {
        isStsEnabled: false;
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken: string | undefined;
    };

    export type Sts = Common & {
        isStsEnabled: true;
        stsUrl: string | undefined;
        region: string | undefined;
        oidc: Oidc.LoggedIn;
        durationSeconds: number | undefined;
        role:
            | {
                  roleARN: string;
                  roleSessionName: string;
              }
            | undefined;
        nameOfBucketToCreateIfNotExist: string | undefined;
        persistance: TokenPersistance<{
            accessKeyId: string;
            expirationTime: number;
            secretAccessKey: string;
            sessionToken: string;
            acquisitionTime: number;
        }>;
    };
}

export function createS3Client(params: ParamsOfCreateS3Client): S3Client {
    const { getNewlyRequestedOrCachedToken, clearCachedToken, getMinioClient } = (() => {
        const { getNewlyRequestedOrCachedToken, clearCachedToken } = (() => {
            if (!params.isStsEnabled) {
                const tokens = {
                    "accessKeyId": params.accessKeyId,
                    "secretAccessKey": params.secretAccessKey,
                    "sessionToken": params.sessionToken,
                    "expirationTime": undefined,
                    "acquisitionTime": undefined
                };

                return {
                    "getNewlyRequestedOrCachedToken": () => Promise.resolve(tokens),
                    "clearCachedToken": () => {
                        throw new Error(
                            "Can't renew token when using non volatile account"
                        );
                    }
                };
            }

            const { oidc, persistance } = params;

            const { getNewlyRequestedOrCachedToken, clearCachedToken } =
                getNewlyRequestedOrCachedTokenFactory({
                    "requestNewToken": async () => {
                        // NOTE: We renew the OIDC access token because it's expiration time
                        // cap the duration of the token we will request to minio so we want it
                        // as fresh as possible.
                        await oidc.renewTokens();

                        const now = Date.now();

                        const { data } = await axios
                            .create({
                                "baseURL": params.stsUrl ?? params.url,
                                "headers": {
                                    "Accept": "*/*"
                                }
                            })
                            .post<string>(
                                "/?" +
                                    Object.entries({
                                        "Action": "AssumeRoleWithWebIdentity",
                                        "WebIdentityToken": oidc.getTokens().accessToken,
                                        "DurationSeconds":
                                            params.durationSeconds ?? 7 * 24 * 3600,
                                        "Version": "2011-06-15",
                                        ...(params.role === undefined
                                            ? {}
                                            : {
                                                  "RoleSessionName":
                                                      params.role.roleSessionName,
                                                  "RoleArn": params.role.roleARN
                                              })
                                    })
                                        .map(([key, value]) =>
                                            value === undefined
                                                ? undefined
                                                : `${key}=${value}`
                                        )
                                        .filter(exclude(undefined))
                                        .join("&")
                            );

                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(data, "text/xml");
                        const root = xmlDoc.getElementsByTagName(
                            "AssumeRoleWithWebIdentityResponse"
                        )[0];

                        const credentials = root.getElementsByTagName("Credentials")[0];
                        const accessKeyId =
                            credentials.getElementsByTagName("AccessKeyId")[0]
                                .childNodes[0].nodeValue;
                        const secretAccessKey =
                            credentials.getElementsByTagName("SecretAccessKey")[0]
                                .childNodes[0].nodeValue;
                        const sessionToken =
                            credentials.getElementsByTagName("SessionToken")[0]
                                .childNodes[0].nodeValue;
                        const expiration =
                            credentials.getElementsByTagName("Expiration")[0]
                                .childNodes[0].nodeValue;

                        assert(
                            accessKeyId !== null &&
                                secretAccessKey !== null &&
                                sessionToken !== null &&
                                expiration !== null,
                            "Error parsing minio response"
                        );

                        return {
                            accessKeyId,
                            "expirationTime": new Date(expiration).getTime(),
                            secretAccessKey,
                            sessionToken,
                            "acquisitionTime": now
                        } satisfies ReturnType<S3Client["getToken"]>;
                    },
                    "returnCachedTokenIfStillValidForXPercentOfItsTTL": "90%",
                    persistance
                });

            return { getNewlyRequestedOrCachedToken, clearCachedToken };
        })();

        const { getMinioClient } = (() => {
            const minioClientByTokens = new WeakMap<
                { accessKeyId: string },
                Minio.Client
            >();

            let hasBufferBeenPolyfilled = false;

            async function getMinioClient() {
                const tokens = await getNewlyRequestedOrCachedToken();

                const cachedMinioClient = minioClientByTokens.get(tokens);

                if (cachedMinioClient !== undefined) {
                    return {
                        "minioClient": cachedMinioClient,
                        tokens
                    };
                }

                const { host, port = 443 } = parseUrl(params.url);

                import_nodejs_buffer_polyfill: {
                    if (hasBufferBeenPolyfilled) {
                        break import_nodejs_buffer_polyfill;
                    }

                    const { Buffer } = await import("buffer");

                    Object.assign(window, { Buffer });

                    hasBufferBeenPolyfilled = true;
                }

                const Minio = await import("minio");

                const minioClient = new Minio.Client({
                    "endPoint": host,
                    "port": port,
                    "useSSL": port !== 80,
                    "accessKey": tokens.accessKeyId,
                    "secretKey": tokens.secretAccessKey,
                    "sessionToken": tokens.sessionToken,
                    "region": params.region
                });

                minioClientByTokens.set(tokens, minioClient);

                return { minioClient, tokens };
            }

            return { getMinioClient };
        })();

        let hasBucketBeenCreated = false;

        async function createBucketIfApplicableAndNotExist() {
            if (!params.isStsEnabled) {
                return;
            }

            const { nameOfBucketToCreateIfNotExist } = params;

            if (nameOfBucketToCreateIfNotExist === undefined) {
                return;
            }

            if (hasBucketBeenCreated) {
                return;
            }

            const { minioClient } = await getMinioClient();

            const doExist = await new Promise<boolean>((resolve, reject) =>
                minioClient.bucketExists(
                    nameOfBucketToCreateIfNotExist,
                    (error, doExist) => {
                        if (error !== null) {
                            reject(error);
                            return;
                        }
                        resolve(doExist);
                    }
                )
            );

            if (doExist) {
                hasBucketBeenCreated = true;
                return;
            }

            await new Promise<void>((resolve, reject) =>
                minioClient.makeBucket(nameOfBucketToCreateIfNotExist, error =>
                    error !== null ? reject(error) : resolve()
                )
            );

            hasBucketBeenCreated = true;
        }

        return {
            "getNewlyRequestedOrCachedToken": async () => {
                await createBucketIfApplicableAndNotExist();

                return getNewlyRequestedOrCachedToken();
            },
            clearCachedToken,
            "getMinioClient": async () => {
                await createBucketIfApplicableAndNotExist();

                return getMinioClient();
            }
        };
    })();

    const s3Client: S3Client = {
        "getToken": async ({ doForceRenew }) => {
            if (doForceRenew) {
                clearCachedToken();
            }

            return getNewlyRequestedOrCachedToken();
        },
        "list": async ({ path }) => {
            const { bucketName, prefix } = (() => {
                const { bucketName, objectName } =
                    bucketNameAndObjectNameFromS3Path(path);

                return {
                    bucketName,
                    "prefix": [objectName].map(s => (s.endsWith("/") ? s : `${s}/`))[0]
                };
            })();

            const { minioClient } = await getMinioClient();

            const stream = minioClient.listObjects(
                bucketName,
                prefix === "/" ? "" : prefix,
                false
            );

            const out: ReturnType<S3Client["list"]> = {
                "directories": [],
                "files": []
            };

            stream.once("end", () => dOut.resolve(out));
            stream.on("data", bucketItem => {
                if (bucketItem.prefix) {
                    out.directories.push(
                        bucketItem.prefix.replace(/\/+$/, "").replace(prefix, "")
                    );
                } else {
                    out.files.push(bucketItem.name.replace(prefix, ""));
                }
            });
            stream.once("error", error => dOut.reject(new Error(String(error))));

            const dOut = new Deferred<typeof out>();

            return dOut.pr;
        },
        "uploadFile": async ({ blob, path, onUploadProgress }) => {
            const stream = fileReaderStream(blob);

            {
                let chunkLengthSum = 0;

                stream.on("data", (chunk: any) => {
                    chunkLengthSum += chunk.length;

                    const uploadPercent = ~~((chunkLengthSum / blob.size) * 100);

                    if (uploadPercent === 100) {
                        return;
                    }

                    onUploadProgress?.({ uploadPercent });
                });
            }

            const { bucketName, objectName } = bucketNameAndObjectNameFromS3Path(path);

            const { minioClient } = await getMinioClient();

            const dOut = new Deferred<void>();

            minioClient.putObject(bucketName, objectName, stream, blob.size, {}, err => {
                if (!!err) {
                    throw err;
                }
                onUploadProgress?.({ "uploadPercent": 100 });

                dOut.resolve();
            });

            return dOut.pr;
        },
        "deleteFile": async ({ path }) => {
            const { bucketName, objectName } = bucketNameAndObjectNameFromS3Path(path);

            const { minioClient } = await getMinioClient();

            await new Promise((resolve, reject) =>
                minioClient.removeObject(bucketName, objectName, err => {
                    if (!!err) {
                        reject(err);
                        return;
                    }
                    resolve(true);
                })
            );
        },
        "getFileDownloadUrl": async ({ path, validityDurationSecond }) => {
            const { bucketName, objectName } = bucketNameAndObjectNameFromS3Path(path);

            const { minioClient, tokens } = await getMinioClient();

            let downloadUrl = await new Promise<string>((resolve, reject) => {
                minioClient.presignedGetObject(
                    bucketName,
                    objectName,
                    validityDurationSecond,
                    (err, url: string) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(url);
                    }
                );
            });

            if (!params.pathStyleAccess) {
                downloadUrl = (() => {
                    const urlObj = new URL(downloadUrl);
                    const subdomain = urlObj.pathname.split("/")[1];

                    urlObj.hostname = `${subdomain}.${urlObj.hostname}`;
                    urlObj.pathname = urlObj.pathname.replace(`/${subdomain}`, "");

                    return urlObj.toString();
                })();
            }

            if (tokens.sessionToken !== undefined) {
                downloadUrl = addParamToUrl({
                    "url": downloadUrl,
                    "name": "X-Amz-Security-Token",
                    "value": tokens.sessionToken
                }).newUrl;
            }

            return downloadUrl;
        }
    };

    return s3Client;
}
