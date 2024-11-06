import axios from "axios";
import type { S3BucketPolicy, S3Client, S3Object } from "core/ports/S3Client";
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
import { checkIfS3KeyIsPublic } from "core/tools/checkIfS3KeyIsPublic";
import { s3BucketPolicySchema } from "./utils/policySchema";
import {
    addObjectNameToListBucketCondition,
    addResourceArnInGetObjectStatement,
    removeObjectNameFromListBucketCondition,
    removeResourceArnInGetObjectStatement
} from "./utils/bucketPolicy";

export type ParamsOfCreateS3Client =
    | ParamsOfCreateS3Client.NoSts
    | ParamsOfCreateS3Client.Sts;

export namespace ParamsOfCreateS3Client {
    export type Common = {
        url: string;
        pathStyleAccess: boolean;
        region: string | undefined;
    };

    export type NoSts = Common & {
        isStsEnabled: false;
        credentials:
            | {
                  accessKeyId: string;
                  secretAccessKey: string;
                  sessionToken: string | undefined;
              }
            | undefined;
    };

    export type Sts = Common & {
        isStsEnabled: true;
        stsUrl: string | undefined;
        oidcParams:
            | {
                  issuerUri?: string;
                  clientId: string;
              }
            | undefined;
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

export function createS3Client(
    params: ParamsOfCreateS3Client,
    getOidc: (
        oidcParams: ParamsOfCreateS3Client.Sts["oidcParams"]
    ) => Promise<Oidc.LoggedIn>
): S3Client {
    const prApi = (async () => {
        const { getNewlyRequestedOrCachedToken, clearCachedToken } = await (async () => {
            if (!params.isStsEnabled) {
                const token =
                    params.credentials === undefined
                        ? undefined
                        : {
                              "accessKeyId": params.credentials.accessKeyId,
                              "secretAccessKey": params.credentials.secretAccessKey,
                              "sessionToken": params.credentials.sessionToken,
                              "expirationTime": undefined,
                              "acquisitionTime": undefined
                          };

                return {
                    "getNewlyRequestedOrCachedToken": () => Promise.resolve(token),
                    "clearCachedToken": () => {
                        throw new Error(
                            "Can't renew token when using non volatile account"
                        );
                    }
                };
            }

            const oidc = await getOidc(params.oidcParams);

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
                            secretAccessKey,
                            sessionToken,
                            "expirationTime": new Date(expiration).getTime(),
                            "acquisitionTime": now
                        };
                    },
                    "returnCachedTokenIfStillValidForXPercentOfItsTTL": "90%"
                });

            if (oidc.authMethod !== "session storage") {
                await clearCachedToken();
            }

            return { getNewlyRequestedOrCachedToken, clearCachedToken };
        })();

        const { getAwsS3Client } = (() => {
            const noTokensRef = { "__noCredentials__": true } as const;

            const awsS3ClientByTokens = new WeakMap<
                { secretAccessKey: string } | { __noCredentials__: true },
                import("@aws-sdk/client-s3").S3Client
            >();

            async function getAwsS3Client() {
                const [tokens, AwsS3Client] = await Promise.all([
                    getNewlyRequestedOrCachedToken(),
                    import("@aws-sdk/client-s3").then(({ S3Client }) => S3Client)
                ] as const);

                const weakMapKey = tokens ?? noTokensRef;

                const cachedAwsS3Client = awsS3ClientByTokens.get(weakMapKey);

                if (cachedAwsS3Client !== undefined) {
                    return {
                        "awsS3Client": cachedAwsS3Client
                    };
                }

                const awsS3Client = new AwsS3Client({
                    "region": params.region ?? "us-east-1",
                    "endpoint": params.url,
                    "forcePathStyle": params.pathStyleAccess,
                    ...(tokens === undefined
                        ? {
                              "signer": {
                                  "sign": request => Promise.resolve(request)
                              }
                          }
                        : {
                              "credentials": {
                                  "accessKeyId": tokens.accessKeyId,
                                  "secretAccessKey": tokens.secretAccessKey,
                                  "sessionToken": tokens.sessionToken
                              }
                          })
                });

                awsS3ClientByTokens.set(weakMapKey, awsS3Client);

                return { awsS3Client };
            }

            return { getAwsS3Client };
        })();

        create_bucket: {
            if (!params.isStsEnabled) {
                break create_bucket;
            }

            const { nameOfBucketToCreateIfNotExist } = params;

            if (nameOfBucketToCreateIfNotExist === undefined) {
                break create_bucket;
            }

            const { awsS3Client } = await getAwsS3Client();

            const { CreateBucketCommand, BucketAlreadyExists, BucketAlreadyOwnedByYou } =
                await import("@aws-sdk/client-s3");

            try {
                await awsS3Client.send(
                    new CreateBucketCommand({
                        "Bucket": nameOfBucketToCreateIfNotExist
                    })
                );
            } catch (error) {
                assert(is<Error>(error));

                if (
                    !(error instanceof BucketAlreadyExists) &&
                    !(error instanceof BucketAlreadyOwnedByYou)
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
        }

        return { getNewlyRequestedOrCachedToken, clearCachedToken, getAwsS3Client };
    })();

    const s3Client: S3Client = {
        "getToken": async ({ doForceRenew }) => {
            const { getNewlyRequestedOrCachedToken, clearCachedToken } = await prApi;

            if (doForceRenew) {
                await clearCachedToken();
            }

            return getNewlyRequestedOrCachedToken();
        },
        "listObjects": async ({ path }) => {
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

            const { getAwsS3Client } = await prApi;

            const { awsS3Client } = await getAwsS3Client();

            const { bucketPolicy, allowedPrefix } = await import("@aws-sdk/client-s3")
                .then(({ GetBucketPolicyCommand }) =>
                    awsS3Client
                        .send(
                            new GetBucketPolicyCommand({
                                Bucket: bucketName
                            })
                        )
                        .catch(() => {
                            console.log("The error is ok, there is no bucket policy");
                            return { Policy: undefined };
                        })
                )
                .then(respPolicy => {
                    if (respPolicy.Policy === undefined)
                        return { bucketPolicy: undefined, allowedPrefix: [] };

                    try {
                        // Validate and parse the policy
                        const parsedPolicy = s3BucketPolicySchema.parse(
                            JSON.parse(respPolicy.Policy)
                        );

                        // Extract allowed prefixes based on the policy statements
                        const allowedPrefix = parsedPolicy.Statement.filter(
                            statement =>
                                statement.Effect === "Allow" &&
                                (statement.Action.includes("s3:GetObject") ||
                                    statement.Action.includes("s3:*"))
                        )
                            .flatMap(statement =>
                                Array.isArray(statement.Resource)
                                    ? statement.Resource
                                    : [statement.Resource]
                            )
                            .map(resource =>
                                resource.replace(`arn:aws:s3:::${bucketName}/`, "")
                            );

                        return { bucketPolicy: parsedPolicy, allowedPrefix };
                    } catch (e) {
                        console.warn(
                            "The best effort attempt failed to parse the policy",
                            e
                        );
                        return { bucketPolicy: undefined, allowedPrefix: [] };
                    }
                });

            const Contents: import("@aws-sdk/client-s3")._Object[] = [];
            const CommonPrefixes: import("@aws-sdk/client-s3").CommonPrefix[] = [];

            {
                let continuationToken: string | undefined;

                do {
                    const resp = await awsS3Client.send(
                        new (await import("@aws-sdk/client-s3")).ListObjectsV2Command({
                            "Bucket": bucketName,
                            "Prefix": prefix,
                            "Delimiter": "/",
                            "ContinuationToken": continuationToken
                        })
                    );

                    Contents.push(...(resp.Contents ?? []));

                    CommonPrefixes.push(...(resp.CommonPrefixes ?? []));

                    continuationToken = resp.NextContinuationToken;
                } while (continuationToken !== undefined);
            }

            const isPathPublic = (path: string) => {
                return checkIfS3KeyIsPublic(allowedPrefix, path);
            };

            const directories = CommonPrefixes.filter(exclude(undefined))
                .map(({ Prefix }) => Prefix)
                .filter(exclude(undefined))
                .map(directoryPath => {
                    const split = directoryPath.split("/");
                    return {
                        kind: "directory",
                        basename: split[split.length - 2],
                        policy: isPathPublic(directoryPath) ? "public" : "private"
                    } satisfies S3Object;
                });

            const files = Contents.filter(({ Key }) => Key !== undefined).map(
                ({ Key, LastModified, Size }) => {
                    assert(Key !== undefined);
                    const split = Key.split("/");
                    return {
                        kind: "file",
                        basename: split[split.length - 1],
                        size: Size,
                        lastModified: LastModified,
                        policy: isPathPublic(Key) ? "public" : "private"
                    } satisfies S3Object;
                }
            );

            return { objects: [...directories, ...files], bucketPolicy };
        },
        "setPathAccessPolicy": async ({ currentBucketPolicy, policy, path }) => {
            const { getAwsS3Client } = await prApi;
            const { awsS3Client } = await getAwsS3Client();

            const { bucketName, objectName } = bucketNameAndObjectNameFromS3Path(path);

            const resourceArn = `arn:aws:s3:::${bucketName}/${objectName}*`;
            const bucketArn = `arn:aws:s3:::${bucketName}`;

            const updatedStatements = (() => {
                switch (policy) {
                    case "public":
                        return addResourceArnInGetObjectStatement(
                            addObjectNameToListBucketCondition(
                                currentBucketPolicy.Statement,
                                bucketArn,
                                objectName
                            ),
                            resourceArn
                        );
                    case "private":
                        return removeResourceArnInGetObjectStatement(
                            removeObjectNameFromListBucketCondition(
                                currentBucketPolicy.Statement,
                                bucketArn,
                                objectName
                            ),
                            resourceArn
                        );
                }
            })();

            const newBucketPolicy = {
                ...currentBucketPolicy,
                Statement: updatedStatements
            } satisfies S3BucketPolicy;

            const command = new (
                await import("@aws-sdk/client-s3")
            ).PutBucketPolicyCommand({
                Bucket: bucketName,
                Policy: JSON.stringify(newBucketPolicy)
            });

            await awsS3Client.send(command);

            return newBucketPolicy;
        },
        "uploadFile": async ({ blob, path, onUploadProgress }) => {
            const { getAwsS3Client } = await prApi;

            const [{ awsS3Client }, Upload] = await Promise.all([
                getAwsS3Client(),
                import("@aws-sdk/lib-storage").then(({ Upload }) => Upload)
            ]);

            const { bucketName, objectName } = bucketNameAndObjectNameFromS3Path(path);

            const upload = new Upload({
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

            const headObjectCommand = new (
                await import("@aws-sdk/client-s3")
            ).HeadObjectCommand({ Bucket: bucketName, Key: objectName });

            const metadata = await awsS3Client.send(headObjectCommand);

            return {
                kind: "file",
                basename: objectName,
                size: metadata.ContentLength,
                lastModified: metadata.LastModified,
                policy: "private"
            };
        },
        "deleteFile": async ({ path }) => {
            const { bucketName, objectName } = bucketNameAndObjectNameFromS3Path(path);

            const { getAwsS3Client } = await prApi;

            const { awsS3Client } = await getAwsS3Client();

            await awsS3Client.send(
                new (await import("@aws-sdk/client-s3")).DeleteObjectCommand({
                    "Bucket": bucketName,
                    "Key": objectName
                })
            );
        },
        "deleteFiles": async ({ paths }) => {
            //bucketName is the same for all paths
            const { bucketName } = bucketNameAndObjectNameFromS3Path(paths[0]);

            const { getAwsS3Client } = await prApi;

            const { awsS3Client } = await getAwsS3Client();

            await awsS3Client.send(
                new (await import("@aws-sdk/client-s3")).DeleteObjectsCommand({
                    "Bucket": bucketName,
                    Delete: {
                        "Objects": paths.map(path => {
                            const { objectName } =
                                bucketNameAndObjectNameFromS3Path(path);
                            return {
                                "Key": objectName
                            };
                        })
                    }
                })
            );
        },
        "getFileDownloadUrl": async ({ path, validityDurationSecond }) => {
            const { bucketName, objectName } = bucketNameAndObjectNameFromS3Path(path);

            const { getAwsS3Client } = await prApi;

            const { awsS3Client } = await getAwsS3Client();

            const downloadUrl = await (
                await import("@aws-sdk/s3-request-presigner")
            ).getSignedUrl(
                awsS3Client,
                new (await import("@aws-sdk/client-s3")).GetObjectCommand({
                    "Bucket": bucketName,
                    "Key": objectName
                }),
                {
                    "expiresIn": validityDurationSecond
                }
            );

            return downloadUrl;
        }

        // "getPresignedUploadUrl": async ({ path, validityDurationSecond }) => {
        //     const { bucketName, objectName } = bucketNameAndObjectNameFromS3Path(path);

        //     const { getAwsS3Client } = await prApi;

        //     const { awsS3Client } = await getAwsS3Client();

        //     const updloadUrl = await (
        //         await import("@aws-sdk/s3-request-presigner")
        //     ).getSignedUrl(
        //         awsS3Client,
        //         new (await import("@aws-sdk/client-s3")).PutObjectCommand({
        //             "Bucket": bucketName,
        //             "Key": objectName
        //         }),
        //         {
        //             "expiresIn": validityDurationSecond
        //         }
        //     );

        //     return updloadUrl;
        // }
    };

    return s3Client;
}
