import type { S3Client } from "core/ports/S3Client";
import {
    getNewlyRequestedOrCachedTokenFactory,
    createSessionStorageTokenPersistence
} from "core/tools/getNewlyRequestedOrCachedToken";
import { assert, is } from "tsafe/assert";
import type { Oidc } from "core/ports/Oidc";
import { getS3UriKey, parseS3Uri } from "core/tools/S3Uri";
import { exclude, id } from "tsafe";
import { fnv1aHashToHex } from "core/tools/fnv1aHashToHex";
import type { OidcParams_Partial } from "core/ports/OnyxiaApi";

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
        oidcParams: OidcParams_Partial;
        durationSeconds: number | undefined;
        role:
            | {
                  roleARN: string;
                  roleSessionName: string;
              }
            | undefined;
    };
}

export function createS3Client(
    params: ParamsOfCreateS3Client,
    getOidc: (
        oidcParams: ParamsOfCreateS3Client.Sts["oidcParams"]
    ) => Promise<{ oidc: Oidc.LoggedIn; doClearCachedS3Token: boolean }>
): S3Client {
    const prApi = (async () => {
        const { getNewlyRequestedOrCachedToken, clearCachedToken } = await (async () => {
            if (!params.isStsEnabled) {
                const token =
                    params.credentials === undefined
                        ? undefined
                        : {
                              accessKeyId: params.credentials.accessKeyId,
                              secretAccessKey: params.credentials.secretAccessKey,
                              sessionToken: params.credentials.sessionToken,
                              expirationTime: undefined,
                              acquisitionTime: undefined
                          };

                return {
                    getNewlyRequestedOrCachedToken: () => Promise.resolve(token),
                    clearCachedToken: () => {
                        throw new Error(
                            "Can't renew token when using non volatile account"
                        );
                    }
                };
            }

            const { oidc, doClearCachedS3Token } = await getOidc(params.oidcParams);

            const { getNewlyRequestedOrCachedToken, clearCachedToken } =
                getNewlyRequestedOrCachedTokenFactory({
                    persistence: createSessionStorageTokenPersistence<{
                        // NOTE: StsToken are like ReturnType<S3Client["getToken"]> but we know that
                        // session token expiration time and acquisition time are defined.
                        accessKeyId: string;
                        secretAccessKey: string;
                        sessionToken: string;
                        expirationTime: number;
                        acquisitionTime: number;
                    }>({
                        sessionStorageKey: `s3ClientToken:${fnv1aHashToHex(
                            (() => {
                                const { durationSeconds, url, stsUrl, role } = params;

                                return JSON.stringify({
                                    durationSeconds,
                                    url,
                                    stsUrl,
                                    role
                                });
                            })()
                        )}`
                    }),
                    requestNewToken: async () => {
                        const { STSClient, AssumeRoleWithWebIdentityCommand } =
                            await import("@aws-sdk/client-sts");

                        const now = Date.now();

                        // NOTE: We renew the OIDC access token because it's expiration time
                        // cap the duration of the token we will request to minio so we want it
                        // as fresh as possible.
                        await oidc.renewTokens();
                        const { accessToken: webIdentityToken } = await oidc.getTokens();

                        // STS client: points either to AWS STS or MinIO’s STS endpoint
                        const sts = new STSClient({
                            region: params.region ?? "us-east-1",
                            endpoint: params.stsUrl ?? params.url
                            // Important: AssumeRoleWithWebIdentity should be unsigned; the SDK handles this.
                            // Do NOT provide AWS credentials here.
                            // If your STS implementation requires querystring-style requests, the SDK will handle that too.
                        });

                        const cmd = new AssumeRoleWithWebIdentityCommand({
                            WebIdentityToken: webIdentityToken,
                            DurationSeconds: params.durationSeconds ?? 7 * 24 * 3600,
                            RoleArn: params.role?.roleARN,
                            RoleSessionName: params.role?.roleSessionName
                        });

                        const { Credentials: credentials } = await sts.send(cmd);
                        if (
                            credentials === undefined ||
                            !credentials.AccessKeyId ||
                            !credentials.SecretAccessKey ||
                            !credentials.SessionToken ||
                            !credentials.Expiration
                        ) {
                            throw new Error(
                                "Invalid STS response when assuming role with web identity"
                            );
                        }

                        return {
                            accessKeyId: credentials.AccessKeyId,
                            secretAccessKey: credentials.SecretAccessKey,
                            sessionToken: credentials.SessionToken,
                            expirationTime: credentials.Expiration.getTime(),
                            acquisitionTime: now
                        };
                    },
                    returnCachedTokenIfStillValidForXPercentOfItsTTL: "90%"
                });

            if (doClearCachedS3Token) {
                await clearCachedToken();
            }

            return { getNewlyRequestedOrCachedToken, clearCachedToken };
        })();

        const { getAwsS3Client } = (() => {
            const noTokensRef = { __noCredentials__: true } as const;

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
                        awsS3Client: cachedAwsS3Client
                    };
                }

                const awsS3Client = new AwsS3Client({
                    region: params.region ?? "us-east-1",
                    endpoint: params.url,
                    forcePathStyle: params.pathStyleAccess,
                    ...(tokens === undefined
                        ? {
                              signer: {
                                  sign: request => Promise.resolve(request)
                              },
                              credentials: { accessKeyId: "", secretAccessKey: "" }
                          }
                        : {
                              credentials: {
                                  accessKeyId: tokens.accessKeyId,
                                  secretAccessKey: tokens.secretAccessKey,
                                  sessionToken: tokens.sessionToken
                              }
                          })
                });

                awsS3ClientByTokens.set(weakMapKey, awsS3Client);

                return { awsS3Client };
            }

            return { getAwsS3Client };
        })();

        return { getNewlyRequestedOrCachedToken, clearCachedToken, getAwsS3Client };
    })();

    const s3Client: S3Client = {
        getToken: async ({ doForceRenew }) => {
            const { getNewlyRequestedOrCachedToken, clearCachedToken } = await prApi;

            if (doForceRenew) {
                await clearCachedToken();
            }

            return getNewlyRequestedOrCachedToken();
        },
        listObjects: async ({ s3Uri }) => {
            const { getAwsS3Client } = await prApi;

            const { awsS3Client } = await getAwsS3Client();

            const Bucket = s3Uri.bucket;
            const Delimiter = s3Uri.delimiter;

            const listObjectsV2Command = new (
                await import("@aws-sdk/client-s3")
            ).ListObjectsV2Command({
                Bucket,
                Prefix: getS3UriKey(s3Uri),
                Delimiter,
                MaxKeys: 1_000
            });

            let resp: import("@aws-sdk/client-s3").ListObjectsV2CommandOutput;

            try {
                resp = await awsS3Client.send(listObjectsV2Command);
            } catch (error) {
                const { NoSuchBucket, S3ServiceException } = await import(
                    "@aws-sdk/client-s3"
                );

                if (error instanceof NoSuchBucket) {
                    return id<S3Client.ListObjectsReturn.Error>({
                        isSuccess: false,
                        errorCase: "no such bucket"
                    });
                }

                if (
                    error instanceof S3ServiceException &&
                    error.$metadata?.httpStatusCode === 403
                ) {
                    return id<S3Client.ListObjectsReturn.Error>({
                        isSuccess: false,
                        errorCase: "access denied"
                    });
                }

                throw error;
            }

            return id<S3Client.ListObjectsReturn.Success>({
                isSuccess: true,
                objects: (resp.Contents ?? [])
                    .map(({ Key, LastModified, Size }) =>
                        Key === undefined
                            ? undefined
                            : {
                                  key: Key,
                                  LastModified,
                                  Size
                              }
                    )
                    .filter(exclude(undefined))
                    .map(({ key, LastModified, Size }) => {
                        assert(LastModified !== undefined);
                        assert(Size !== undefined);
                        const s3Uri = parseS3Uri({
                            delimiter: Delimiter,
                            value: `s3://${Bucket}/${key}`
                        });
                        assert(!s3Uri.isDelimiterTerminated);

                        return id<S3Client.ListObjectsReturn.Success.Object>({
                            s3Uri,
                            lastModified: LastModified.getTime(),
                            size: Size
                        });
                    }),

                prefixes: (resp.CommonPrefixes ?? [])
                    .map(({ Prefix }) => Prefix)
                    .filter(prefix => prefix !== undefined)
                    .map(prefix => {
                        const s3Uri = parseS3Uri({
                            delimiter: Delimiter,
                            value: `s3://${Bucket}/${prefix}`
                        });

                        assert(s3Uri.isDelimiterTerminated);

                        return s3Uri;
                    })
            });
        },
        putObject: async ({ s3Uri, blob, onUploadProgress }) => {
            const { getAwsS3Client } = await prApi;

            const [{ awsS3Client }, Upload] = await Promise.all([
                getAwsS3Client(),
                import("@aws-sdk/lib-storage").then(({ Upload }) => Upload)
            ]);

            const Bucket = s3Uri.bucket;

            const upload = new Upload({
                client: awsS3Client,
                params: {
                    Bucket,
                    Key: getS3UriKey(s3Uri),
                    Body: blob,
                    ContentType: blob.type
                },
                partSize: 5 * 1024 * 1024, // optional size of each part
                leavePartsOnError: false // optional manually handle dropped parts
            });
            upload.on("httpUploadProgress", ({ total, loaded }) => {
                if (total === undefined || loaded === undefined) {
                    return;
                }

                if (total === 0) {
                    onUploadProgress?.({ uploadPercent: 100 });
                    return;
                }

                const uploadPercent = Math.floor((loaded / total) * 100);

                if (uploadPercent !== 100) {
                    onUploadProgress?.({ uploadPercent });
                }
            });

            await upload.done();

            onUploadProgress?.({ uploadPercent: 100 });
        },
        deleteObject: async ({ s3Uri }) => {
            const { getAwsS3Client } = await prApi;

            const { awsS3Client } = await getAwsS3Client();

            await awsS3Client.send(
                new (await import("@aws-sdk/client-s3")).DeleteObjectCommand({
                    Bucket: s3Uri.bucket,
                    Key: getS3UriKey(s3Uri)
                })
            );
        },
        generateSignedDownloadUrl: async ({ s3Uri, validityDurationSecond }) => {
            const { getAwsS3Client } = await prApi;

            const { awsS3Client } = await getAwsS3Client();

            const downloadUrl = await (
                await import("@aws-sdk/s3-request-presigner")
            ).getSignedUrl(
                awsS3Client,
                new (await import("@aws-sdk/client-s3")).GetObjectCommand({
                    Bucket: s3Uri.bucket,
                    Key: getS3UriKey(s3Uri)
                }),
                {
                    expiresIn: validityDurationSecond
                }
            );

            return downloadUrl;
        },

        getObjectContent: async ({ s3Uri, range }) => {
            const { getAwsS3Client } = await prApi;
            const { awsS3Client } = await getAwsS3Client();

            const { GetObjectCommand } = await import("@aws-sdk/client-s3");

            const response = await awsS3Client.send(
                new GetObjectCommand({
                    Bucket: s3Uri.bucket,
                    Key: getS3UriKey(s3Uri),
                    ...(range !== undefined ? { Range: range } : {})
                })
            );

            assert(response.Body instanceof ReadableStream);

            return {
                stream: response.Body,
                size: response.ContentLength,
                contentType: response.ContentType
            };
        },

        getObjectContentType: async ({ s3Uri }) => {
            const { getAwsS3Client } = await prApi;

            const { awsS3Client } = await getAwsS3Client();

            const head = await awsS3Client.send(
                new (await import("@aws-sdk/client-s3")).HeadObjectCommand({
                    Bucket: s3Uri.bucket,
                    Key: getS3UriKey(s3Uri)
                })
            );

            return head.ContentType;
        },
        createBucket: async ({ bucket }) => {
            const { getAwsS3Client } = await prApi;

            const { awsS3Client } = await getAwsS3Client();

            const {
                CreateBucketCommand,
                BucketAlreadyExists,
                BucketAlreadyOwnedByYou,
                S3ServiceException
            } = await import("@aws-sdk/client-s3");

            try {
                await awsS3Client.send(
                    new CreateBucketCommand({
                        Bucket: bucket
                    })
                );
            } catch (error) {
                assert(is<Error>(error));

                if (
                    error instanceof S3ServiceException &&
                    error.$metadata?.httpStatusCode === 403
                ) {
                    return {
                        isSuccess: false,
                        errorCase: "access denied",
                        errorMessage: error.message
                    };
                }

                if (
                    !(error instanceof BucketAlreadyExists) &&
                    !(error instanceof BucketAlreadyOwnedByYou)
                ) {
                    return {
                        isSuccess: false,
                        errorCase: "already exist",
                        errorMessage: error.message
                    };
                }
            }

            return { isSuccess: true };
        }
    };

    return s3Client;
}
