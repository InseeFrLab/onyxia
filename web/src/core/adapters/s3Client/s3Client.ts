import type { S3Client } from "core/ports/S3Client";
import type { BucketPolicies } from "core/tools/bucketPolicies";
import {
    getNewlyRequestedOrCachedTokenFactory,
    createSessionStorageTokenPersistence
} from "core/tools/getNewlyRequestedOrCachedToken";
import { assert, is, typeGuard, type Equals } from "tsafe";
import type { Oidc } from "core/ports/Oidc";
import { getS3UriKey, parseS3Uri } from "core/tools/S3Uri";
import { exclude, id } from "tsafe";
import { fnv1aHashToHex } from "core/tools/fnv1aHashToHex";
import type { OidcParams_Partial } from "core/ports/OnyxiaApi";
import { Evt } from "evt";
import * as runExclusive from "run-exclusive";

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
        role: {
            roleARN: string;
            roleSessionName: string;
        };
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
                            RoleArn: params.role.roleARN || undefined,
                            RoleSessionName: params.role.roleSessionName || undefined
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
        getUnsignedObjectHttpUrl: ({ s3Uri }) => {
            const url = new URL(params.url);
            const pathname = url.pathname.endsWith("/")
                ? url.pathname.slice(0, -1)
                : url.pathname;
            const encodedKey = getS3UriKey(s3Uri)
                .split("/")
                .map(encodeURIComponent)
                .join("/");

            if (params.pathStyleAccess) {
                url.pathname = `${pathname}/${encodeURIComponent(
                    s3Uri.bucket
                )}/${encodedKey}`;
            } else {
                url.hostname = `${s3Uri.bucket}.${url.hostname}`;
                url.pathname = `${pathname}/${encodedKey}`;
            }

            url.search = "";
            url.hash = "";

            return url.href;
        },
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
                        if (s3Uri.isDelimiterTerminated) {
                            console.warn(
                                [
                                    `Skipping "${key}".`,
                                    "Objects with key that's ends with a delimiter can't be handled."
                                ].join(" ")
                            );
                            return undefined;
                        }
                        return id<S3Client.ListObjectsReturn.Success.Object>({
                            s3Uri,
                            lastModified: LastModified.getTime(),
                            size: Size
                        });
                    })
                    .filter(exclude(undefined)),

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
        putObject: (() => {
            const putObject_actual: S3Client["putObject"] = runExclusive.build(
                async ({ s3Uri, blob, onUploadProgress, evtCancel }) => {
                    const { getAwsS3Client } = await prApi;

                    const [{ awsS3Client }, Upload] = await Promise.all([
                        getAwsS3Client(),
                        import("@aws-sdk/lib-storage").then(({ Upload }) => Upload)
                    ]);

                    if (evtCancel.postCount !== 0) {
                        return {
                            status: "canceled"
                        };
                    }

                    const upload = new Upload({
                        client: awsS3Client,
                        params: {
                            Bucket: s3Uri.bucket,
                            Key: getS3UriKey(s3Uri),
                            Body: blob,
                            ContentType: blob.type
                        }
                    });

                    const onHttpUploadProgress = (params: {
                        total?: number;
                        loaded?: number;
                    }) => {
                        const { total, loaded } = params;

                        if (total === undefined || loaded === undefined) {
                            return;
                        }

                        if (total === 0) {
                            onUploadProgress?.({ uploadPercent: 99 });
                            return;
                        }

                        const uploadPercent = Math.floor((loaded / total) * 100);

                        if (uploadPercent !== 100) {
                            onUploadProgress?.({ uploadPercent });
                        }
                    };

                    upload.on("httpUploadProgress", onHttpUploadProgress);

                    evtCancel.attachOnce(() => {
                        upload.off("httpUploadProgress", onHttpUploadProgress);
                        upload.abort();
                    });

                    const completionStatus = await Promise.race([
                        (async () => {
                            try {
                                await upload.done();
                            } catch (error) {
                                assert(error instanceof Error);
                                return {
                                    case: "failed" as const,
                                    error
                                };
                            }
                            return { case: "success" as const };
                        })(),
                        evtCancel.waitFor().then(() => ({ case: "canceled" as const }))
                    ]);

                    switch (completionStatus.case) {
                        case "canceled":
                            return { status: "canceled" };
                        case "failed":
                            return { status: "failed", error: completionStatus.error };
                        case "success":
                            onUploadProgress?.({ uploadPercent: 100 });
                            return { status: "success" };
                        default:
                            assert<Equals<typeof completionStatus, never>>(false);
                    }
                }
            );

            return async params => {
                const ctx = Evt.newCtx();

                const evtCancel = params.evtCancel.pipe(ctx);

                const putObjectResult = await Promise.race([
                    putObject_actual({
                        ...params,
                        evtCancel
                    }),
                    evtCancel.waitFor().then(() => ({ status: "canceled" as const }))
                ]);

                ctx.done();

                return putObjectResult;
            };
        })(),
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
        getSignedObjectHttpUrl: async ({ s3Uri, validityDurationSecond }) => {
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
        },
        getBucketPolicies: async ({ bucket }) => {
            const { getAwsS3Client } = await prApi;

            const { awsS3Client } = await getAwsS3Client();

            const { GetBucketPolicyCommand, S3ServiceException } = await import(
                "@aws-sdk/client-s3"
            );

            let policy: string | undefined;

            try {
                ({ Policy: policy } = await awsS3Client.send(
                    new GetBucketPolicyCommand({
                        Bucket: bucket
                    })
                ));
            } catch (error) {
                if (error instanceof S3ServiceException) {
                    const httpStatusCode = error.$metadata?.httpStatusCode;

                    if (httpStatusCode === 404) {
                        console.log(
                            [
                                `Onyxia: The 404 here is fine`,
                                `the bucket just doesn't have bucket policies yet.`
                            ].join(" ")
                        );
                        return {
                            Version: "2012-10-17",
                            Statement: []
                        };
                    }

                    if (
                        httpStatusCode === 403 ||
                        httpStatusCode === 405 ||
                        httpStatusCode === 501 ||
                        error.name === "NoSuchBucketPolicy" ||
                        error.name === "NotImplemented" ||
                        error.name === "NotSupported"
                    ) {
                        return undefined;
                    }
                }

                throw error;
            }

            if (policy === undefined) {
                return undefined;
            }

            const bucketPolicies: unknown = JSON.parse(policy);

            assert(
                typeGuard<BucketPolicies>(
                    bucketPolicies,
                    typeof bucketPolicies === "object" &&
                        bucketPolicies !== null &&
                        !Array.isArray(bucketPolicies)
                )
            );

            return bucketPolicies;
        },
        putBucketPolicies: async ({ bucket, bucketPolicies }) => {
            const { getAwsS3Client } = await prApi;

            const { awsS3Client } = await getAwsS3Client();

            const { PutBucketPolicyCommand } = await import("@aws-sdk/client-s3");

            try {
                await awsS3Client.send(
                    new PutBucketPolicyCommand({
                        Bucket: bucket,
                        Policy: JSON.stringify(bucketPolicies)
                    })
                );
            } catch (error) {
                assert(is<Error>(error));

                return {
                    isSuccess: false,
                    errorMessage: error.message
                };
            }

            return { isSuccess: true };
        }
    };

    return s3Client;
}
