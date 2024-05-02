import axios from "axios";
import type { S3Client } from "core/ports/S3Client";
import {
    getNewlyRequestedOrCachedTokenFactory,
    createSessionStorageTokenPersistance
} from "core/tools/getNewlyRequestedOrCachedToken";
import { assert } from "tsafe/assert";
import { is } from "tsafe/is";
import type { Oidc } from "core/ports/Oidc";
import { bucketNameAndObjectNameFromS3Path } from "./utils/bucketNameAndObjectNameFromS3Path";
import { exclude } from "tsafe/exclude";
import { fnv1aHashToHex } from "core/tools/fnv1aHashToHex";
import * as ns_aws_sdk_client_s3 from "@aws-sdk/client-s3";
import * as ns_aws_sdk_lib_storage from "@aws-sdk/lib-storage";
import * as ns_aws_sdk_s3_request_presigner from "@aws-sdk/s3-request-presigner";

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
    };
}

export function createS3Client(params: ParamsOfCreateS3Client): S3Client {
    const { getNewlyRequestedOrCachedToken, clearCachedToken, getAwsS3Client } = (() => {
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

            const { oidc } = params;

            const { getNewlyRequestedOrCachedToken, clearCachedToken } =
                getNewlyRequestedOrCachedTokenFactory({
                    "persistance": createSessionStorageTokenPersistance<{
                        // NOTE: StsToken are like ReturnType<S3Client["getToken"]> but we know that
                        // session token expiration time and acquisition time are defined.
                        accessKeyId: string;
                        secretAccessKey: string;
                        sessionToken: string;
                        expirationTime: number;
                        acquisitionTime: number;
                    }>({
                        "sessionStorageKey":
                            "s3ClientToken_" +
                            fnv1aHashToHex(
                                (() => {
                                    const { durationSeconds, url, stsUrl, role } = params;

                                    return JSON.stringify({
                                        durationSeconds,
                                        url,
                                        stsUrl,
                                        role
                                    });
                                })()
                            )
                    }),
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
                        };
                    },
                    "returnCachedTokenIfStillValidForXPercentOfItsTTL": "90%"
                });

            return { getNewlyRequestedOrCachedToken, clearCachedToken };
        })();

        const { getAwsS3Client } = (() => {
            const awsS3ClientByTokens = new WeakMap<
                { accessKeyId: string },
                ns_aws_sdk_client_s3.S3Client
            >();

            async function getAwsS3Client() {
                const tokens = await getNewlyRequestedOrCachedToken();

                const cachedAwsS3Client = awsS3ClientByTokens.get(tokens);

                if (cachedAwsS3Client !== undefined) {
                    return {
                        "awsS3Client": cachedAwsS3Client
                    };
                }

                const awsS3Client = new ns_aws_sdk_client_s3.S3Client({
                    "region": params.region ?? "us-east-1",
                    "credentials": {
                        "accessKeyId": tokens.accessKeyId,
                        "secretAccessKey": tokens.secretAccessKey,
                        "sessionToken": tokens.sessionToken
                    },
                    "endpoint": params.url,
                    "forcePathStyle": params.pathStyleAccess
                });

                awsS3ClientByTokens.set(tokens, awsS3Client);

                return { awsS3Client };
            }

            return { getAwsS3Client };
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

            const { awsS3Client } = await getAwsS3Client();

            try {
                await awsS3Client.send(
                    new ns_aws_sdk_client_s3.CreateBucketCommand({
                        "Bucket": nameOfBucketToCreateIfNotExist
                    })
                );
            } catch (error) {
                assert(is<Error>(error));

                if (
                    !(error instanceof ns_aws_sdk_client_s3.BucketAlreadyExists) &&
                    !(error instanceof ns_aws_sdk_client_s3.BucketAlreadyOwnedByYou)
                ) {
                    throw error;
                }

                console.log(
                    [
                        `The above network error is expected we tried creating the `,
                        `bucket ${nameOfBucketToCreateIfNotExist} in case it didn't exist but it did.`
                    ].join(" ")
                );
            }

            hasBucketBeenCreated = true;
        }

        return {
            "getNewlyRequestedOrCachedToken": async () => {
                await createBucketIfApplicableAndNotExist();

                return getNewlyRequestedOrCachedToken();
            },
            clearCachedToken,
            "getAwsS3Client": async () => {
                await createBucketIfApplicableAndNotExist();

                return getAwsS3Client();
            }
        };
    })();

    const s3Client: S3Client = {
        "url": params.url,
        "pathStyleAccess": params.pathStyleAccess,
        "getToken": async ({ doForceRenew }) => {
            if (doForceRenew) {
                await clearCachedToken();
            }

            return getNewlyRequestedOrCachedToken();
        },
        "list": async ({ path }) => {
            const { bucketName, prefix } = (() => {
                const { bucketName, objectName } =
                    bucketNameAndObjectNameFromS3Path(path);

                const prefix =
                    objectName === ""
                        ? ""
                        : objectName.endsWith("/")
                          ? objectName
                          : `${objectName}/`;

                return {
                    bucketName,
                    prefix
                };
            })();

            const { awsS3Client } = await getAwsS3Client();

            const Contents: ns_aws_sdk_client_s3._Object[] = [];
            const CommonPrefixes: ns_aws_sdk_client_s3.CommonPrefix[] = [];

            {
                let continuationToken: string | undefined;

                do {
                    const resp = await awsS3Client.send(
                        new ns_aws_sdk_client_s3.ListObjectsV2Command({
                            "Bucket": bucketName,
                            "Prefix": prefix,
                            "Delimiter": "/",
                            "ContinuationToken": continuationToken
                        })
                    );

                    Contents.push(...(resp.Contents ?? []));
                    CommonPrefixes.push(...(resp.CommonPrefixes ?? []));

                    continuationToken = resp.NextContinuationToken;
                } while (continuationToken);
            }

            return {
                "directories": CommonPrefixes.map(({ Prefix }) => Prefix)
                    .filter(exclude(undefined))
                    .map(directoryPath => {
                        const split = directoryPath.split("/");
                        return split[split.length - 2];
                    }),
                "files": Contents.map(({ Key }) => Key)
                    .filter(exclude(undefined))
                    .map(filePath => {
                        const split = filePath.split("/");
                        return split[split.length - 1];
                    })
            };
        },
        "uploadFile": async ({ blob, path, onUploadProgress }) => {
            const { awsS3Client } = await getAwsS3Client();

            const { bucketName, objectName } = bucketNameAndObjectNameFromS3Path(path);

            const upload = new ns_aws_sdk_lib_storage.Upload({
                "client": awsS3Client,
                "params": {
                    "Bucket": bucketName,
                    "Key": objectName,
                    "Body": blob
                },
                "partSize": 5 * 1024 * 1024, // optional size of each part
                "leavePartsOnError": false // optional manually handle dropped parts
            });

            upload.on("httpUploadProgress", ({ total, loaded }) => {
                if (total === undefined || loaded === undefined) {
                    return;
                }

                const uploadPercent = Math.floor((loaded / total) * 100);

                onUploadProgress?.({ uploadPercent });
            });

            await upload.done();
        },
        "deleteFile": async ({ path }) => {
            const { bucketName, objectName } = bucketNameAndObjectNameFromS3Path(path);

            const { awsS3Client } = await getAwsS3Client();

            await awsS3Client.send(
                new ns_aws_sdk_client_s3.DeleteObjectCommand({
                    "Bucket": bucketName,
                    "Key": objectName
                })
            );
        },
        "getFileDownloadUrl": async ({ path, validityDurationSecond }) => {
            const { bucketName, objectName } = bucketNameAndObjectNameFromS3Path(path);

            const { awsS3Client } = await getAwsS3Client();

            const downloadUrl = await ns_aws_sdk_s3_request_presigner.getSignedUrl(
                awsS3Client,
                new ns_aws_sdk_client_s3.GetObjectCommand({
                    "Bucket": bucketName,
                    "Key": objectName
                }),
                {
                    "expiresIn": validityDurationSecond
                }
            );

            return downloadUrl;
        }
    };

    return s3Client;
}
