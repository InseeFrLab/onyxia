import axios from "axios";
import type * as Minio from "minio";
import type { ReturnType } from "tsafe";
import { S3Client } from "core/ports/S3Client";
import { getNewlyRequestedOrCachedTokenFactory } from "core/tools/getNewlyRequestedOrCachedToken";
import { assert, type Equals } from "tsafe/assert";
import { Deferred } from "evt/tools/Deferred";
import { parseUrl } from "core/tools/parseUrl";
import fileReaderStream from "filereader-stream";
import type { Oidc } from "core/ports/Oidc";
import { addParamToUrl } from "powerhooks/tools/urlSearchParams";
import { amazonS3Url } from "./utils/amazonS3Url";
import { defaultS3Region } from "./utils/defaultS3Region";
import { bucketNameAndObjectNameFromS3Path } from "./utils/bucketNameAndObjectNameFromS3Path";
import { exclude } from "tsafe/exclude";

export type ParamsOfCreateS3Client =
    | ParamsOfCreateS3Client.AuthWithProvidedAccount
    | ParamsOfCreateS3Client.AuthWithVolatileAccount;

export namespace ParamsOfCreateS3Client {
    export type AuthWithProvidedAccount = {
        authWith: "provided S3 account credentials";
        url: string;
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken: string | undefined;
    };

    export type AuthWithVolatileAccount =
        | AuthWithVolatileAccount.OnPremise
        | AuthWithVolatileAccount.CloudProvider;

    export namespace AuthWithVolatileAccount {
        export type Common = {
            authWith: "volatile S3 Account dynamically created with OIDC";
            oidc: Oidc.LoggedIn;
            requestedTokenValidityDurationSeconds: number | undefined;
            nameOfBucketToCreateIfNotExist: string | undefined;
            region: string | undefined;
            roleARN: string | undefined;
            roleSessionName: string | undefined;
        };

        export type OnPremise = Common & {
            isOnPremise: true;
            url: string;
        };

        export type CloudProvider = CloudProvider.AmazonWebServices;

        export namespace CloudProvider {
            type CloudProviderCommon = Common & {
                isOnPremise: false;
                cloudProvider: "Amazon web services";
            };

            export type AmazonWebServices = CloudProviderCommon & {
                region: string;
                roleARN: string;
                roleSessionName: string;
                createAwsBucket: (params: {
                    region: string;
                    accessKey: string;
                    secretKey: string;
                    sessionToken: string;
                    bucketName: string;
                }) => Promise<void>;
            };
        }
    }
}

export function createS3Client(params: ParamsOfCreateS3Client): S3Client {
    const { getNewlyRequestedOrCachedToken, clearCachedToken, getMinioClient } = (() => {
        const url: string = (() => {
            switch (params.authWith) {
                case "provided S3 account credentials":
                    return params.url;
                case "volatile S3 Account dynamically created with OIDC":
                    return params.isOnPremise
                        ? params.url
                        : (() => {
                              switch (params.cloudProvider) {
                                  case "Amazon web services":
                                      return amazonS3Url;
                              }
                          })();
            }
        })();

        const { getNewlyRequestedOrCachedToken, clearCachedToken } = (() => {
            if (params.authWith === "provided S3 account credentials") {
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

            assert<
                Equals<
                    typeof params.authWith,
                    "volatile S3 Account dynamically created with OIDC"
                >
            >();

            const { oidc } = params;

            const requestedTokenValidityDurationSeconds: number =
                params.requestedTokenValidityDurationSeconds ?? params.isOnPremise
                    ? 7 * 24 * 3600
                    : (() => {
                          switch (params.cloudProvider) {
                              case "Amazon web services":
                                  return 12 * 3600; // AWS STS session token max duration is 12 hours
                          }
                      })();

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
                                "baseURL": url,
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
                                            requestedTokenValidityDurationSeconds,
                                        "Version": "2011-06-15",
                                        "RoleSessionName": params.roleSessionName,
                                        "RoleArn": params.roleARN
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
                    "returnCachedTokenIfStillValidForXPercentOfItsTTL": "90%"
                });

            return { getNewlyRequestedOrCachedToken, clearCachedToken };
        })();

        const region: string = (() => {
            switch (params.authWith) {
                case "provided S3 account credentials":
                    return params.region;
                case "volatile S3 Account dynamically created with OIDC":
                    return params.isOnPremise
                        ? params.region ?? defaultS3Region
                        : (() => {
                              switch (params.cloudProvider) {
                                  case "Amazon web services":
                                      return params.region;
                              }
                          })();
            }
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

                const { host, port = 443 } = parseUrl(url);

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
                    region
                });

                minioClientByTokens.set(tokens, minioClient);

                return { minioClient, tokens };
            }

            return { getMinioClient };
        })();

        let hasBucketBeenCreated = false;

        async function createBucketIfApplicableAndNotExist() {
            if (params.authWith === "provided S3 account credentials") {
                return;
            }

            assert<
                Equals<
                    typeof params.authWith,
                    "volatile S3 Account dynamically created with OIDC"
                >
            >();

            const { nameOfBucketToCreateIfNotExist } = params;

            if (nameOfBucketToCreateIfNotExist === undefined) {
                return;
            }

            if (hasBucketBeenCreated) {
                return;
            }

            const { minioClient, tokens } = await getMinioClient();

            let doExist: boolean;

            try {
                doExist = await new Promise<boolean>((resolve, reject) =>
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
            } catch (error) {
                const isCorsError = (function isCorsError(error: unknown): boolean {
                    console.log(`TODO: Test if actually a CORS error`, error);
                    return true;
                })(error);

                if (!isCorsError) {
                    throw error;
                }
                console.log(
                    [
                        `You can ignore the CORS error above, it mean that`,
                        `the ${params.nameOfBucketToCreateIfNotExist} bucket doesn't exist yet.`,
                        `and we need to create it`
                    ].join(" ")
                );

                doExist = false;
            }

            if (doExist) {
                hasBucketBeenCreated = true;
                return;
            }

            if (params.isOnPremise) {
                await new Promise<void>((resolve, reject) =>
                    minioClient.makeBucket(nameOfBucketToCreateIfNotExist, error =>
                        error !== null ? reject(error) : resolve()
                    )
                );
            } else {
                // Because we are in volatile account mode
                assert(tokens.sessionToken !== undefined);

                switch (params.cloudProvider) {
                    case "Amazon web services":
                        await params.createAwsBucket({
                            "accessKey": tokens.accessKeyId,
                            "secretKey": tokens.secretAccessKey,
                            "sessionToken": tokens.sessionToken,
                            region,
                            "bucketName": nameOfBucketToCreateIfNotExist
                        });

                        break;
                    default:
                        assert<Equals<typeof params.cloudProvider, never>>();
                }
            }

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
        "getFileDownloadUrl": async ({ path }) => {
            const { bucketName, objectName } = bucketNameAndObjectNameFromS3Path(path);

            const { minioClient, tokens } = await getMinioClient();

            let downloadUrl = await new Promise<string>((resolve, reject) => {
                minioClient.presignedGetObject(
                    bucketName,
                    objectName,
                    3600, //One hour
                    (err, url: string) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(url);
                    }
                );
            });

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
