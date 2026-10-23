import type { S3Client } from "core/ports/S3Client";
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

            type Token = NonNullable<
                Awaited<ReturnType<typeof getNewlyRequestedOrCachedToken>>
            >;

            async function getAwsS3Client(options?: { token: Token }) {
                const [tokens, AwsS3Client] = await Promise.all([
                    options === undefined
                        ? getNewlyRequestedOrCachedToken()
                        : Promise.resolve(options.token),
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

    const isAnonymousProfile = params.isStsEnabled
        ? false
        : params.credentials === undefined;

    const s3Client: S3Client = {
        getUnsignedObjectHttpUrl: ({ s3Uri, isForDirectDownload }) => {
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

            if (isForDirectDownload && !isAnonymousProfile) {
                url.searchParams.set("response-content-disposition", "attachment");
            }

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

            const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");

            const contents: NonNullable<
                import("@aws-sdk/client-s3").ListObjectsV2CommandOutput["Contents"]
            > = [];
            const commonPrefixes: NonNullable<
                import("@aws-sdk/client-s3").ListObjectsV2CommandOutput["CommonPrefixes"]
            > = [];

            try {
                let ContinuationToken: string | undefined = undefined;

                while (true) {
                    const resp: import("@aws-sdk/client-s3").ListObjectsV2CommandOutput =
                        await awsS3Client.send(
                            new ListObjectsV2Command({
                                Bucket,
                                Prefix: getS3UriKey(s3Uri),
                                Delimiter,
                                MaxKeys: 1_000,
                                ContinuationToken
                            })
                        );

                    contents.push(...(resp.Contents ?? []));
                    commonPrefixes.push(...(resp.CommonPrefixes ?? []));

                    if (!resp.IsTruncated) {
                        break;
                    }

                    ContinuationToken = resp.NextContinuationToken;

                    if (ContinuationToken === undefined) {
                        throw new Error(
                            "Missing NextContinuationToken in truncated ListObjectsV2 response"
                        );
                    }
                }
            } catch (error) {
                const { NoSuchBucket, S3ServiceException } = await import(
                    "@aws-sdk/client-s3"
                );

                if (error instanceof NoSuchBucket) {
                    return id<S3Client.ListObjectsReturn.Error>({
                        isSuccess: false,
                        isKnownError: true,
                        errorCase: "no such bucket"
                    });
                }

                if (
                    error instanceof S3ServiceException &&
                    error.$metadata?.httpStatusCode === 403
                ) {
                    return id<S3Client.ListObjectsReturn.Error>({
                        isSuccess: false,
                        isKnownError: true,
                        errorCase: "access denied"
                    });
                }

                if (
                    error instanceof TypeError &&
                    error.message === "Failed to fetch" &&
                    (await fetch(params.url, { mode: "no-cors" }).then(
                        () => true,
                        () => false
                    ))
                ) {
                    return id<S3Client.ListObjectsReturn.Error>({
                        isSuccess: false,
                        isKnownError: true,
                        errorCase: "CORS error"
                    });
                }

                return id<S3Client.ListObjectsReturn.Error>({
                    isSuccess: false,
                    isKnownError: false,
                    errorMessage: error instanceof Error ? error.message : String(error)
                });
            }

            return id<S3Client.ListObjectsReturn.Success>({
                isSuccess: true,
                objects: contents
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

                prefixes: commonPrefixes
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
        copyObject: async ({
            sourceS3Uri,
            destinationS3Uri,
            onCopyProgress,
            evtCancel
        }) => {
            if (evtCancel.postCount !== 0) {
                return { status: "canceled" };
            }

            const ctx = Evt.newCtx();
            const abortController = new AbortController();
            let isCanceled = false;
            let uploadId: string | undefined;
            let isCopyComplete = false;

            evtCancel.attachOnce(ctx, () => {
                isCanceled = true;
                abortController.abort();
            });

            try {
                const sourceKey = getS3UriKey(sourceS3Uri);
                const destinationKey = getS3UriKey(destinationS3Uri);

                assert(
                    sourceS3Uri.bucket !== destinationS3Uri.bucket ||
                        sourceKey !== destinationKey,
                    "Source and destination must be different objects"
                );

                const { getAwsS3Client } = await prApi;
                const sdk = await import("@aws-sdk/client-s3");
                const { awsS3Client } = await getAwsS3Client();
                abortController.signal.throwIfAborted();
                onCopyProgress({ copyPercent: 0 });

                const head = await awsS3Client.send(
                    new sdk.HeadObjectCommand({
                        Bucket: sourceS3Uri.bucket,
                        Key: sourceKey
                    }),
                    { abortSignal: abortController.signal }
                );
                const size = head.ContentLength;
                assert(
                    size !== undefined && Number.isSafeInteger(size) && size >= 0,
                    "Missing or invalid source object size"
                );
                assert(head.ETag !== undefined, "Missing source object ETag");

                const copySource =
                    [sourceS3Uri.bucket, ...sourceKey.split("/")]
                        .map(encodeURIComponent)
                        .join("/") +
                    (head.VersionId === undefined
                        ? ""
                        : `?versionId=${encodeURIComponent(head.VersionId)}`);
                const destination = {
                    Bucket: destinationS3Uri.bucket,
                    Key: destinationKey
                };
                const source = {
                    CopySource: copySource,
                    CopySourceIfMatch: head.ETag
                };
                const maxPartSize = 5 * 1024 ** 3;

                if (size <= maxPartSize) {
                    const result = await awsS3Client.send(
                        new sdk.CopyObjectCommand({
                            ...destination,
                            ...source,
                            MetadataDirective: "COPY",
                            TaggingDirective: "COPY",
                            WebsiteRedirectLocation: head.WebsiteRedirectLocation
                        }),
                        { abortSignal: abortController.signal }
                    );
                    assert(
                        result.CopyObjectResult?.ETag !== undefined,
                        "Missing object copy result"
                    );
                } else {
                    const partSize = Math.max(64 * 1024 ** 2, Math.ceil(size / 10_000));
                    assert(partSize <= maxPartSize, "Object is too large to copy");

                    let tagging: string | undefined;

                    try {
                        const { TagSet } = await awsS3Client.send(
                            new sdk.GetObjectTaggingCommand({
                                Bucket: sourceS3Uri.bucket,
                                Key: sourceKey,
                                VersionId: head.VersionId
                            }),
                            { abortSignal: abortController.signal }
                        );
                        assert(TagSet !== undefined, "Missing source object tags");
                        tagging = TagSet.map(({ Key, Value }) => {
                            assert(Key !== undefined && Value !== undefined);
                            return `${encodeURIComponent(Key)}=${encodeURIComponent(Value)}`;
                        }).join("&");
                    } catch (error) {
                        // Some S3 implementations don't implement object tagging.
                        if (
                            !(error instanceof sdk.S3ServiceException) ||
                            error.$metadata.httpStatusCode !== 501
                        ) {
                            throw error;
                        }
                    }

                    abortController.signal.throwIfAborted();
                    // Let initiation settle so cancellation can clean up its upload ID.
                    const initiated = await awsS3Client.send(
                        new sdk.CreateMultipartUploadCommand({
                            ...destination,
                            CacheControl: head.CacheControl,
                            ContentDisposition: head.ContentDisposition,
                            ContentEncoding: head.ContentEncoding,
                            ContentLanguage: head.ContentLanguage,
                            ContentType: head.ContentType,
                            Expires: head.Expires,
                            Metadata: head.Metadata,
                            WebsiteRedirectLocation: head.WebsiteRedirectLocation,
                            Tagging: tagging || undefined
                        })
                    );
                    uploadId = initiated.UploadId;
                    assert(uploadId !== undefined, "Missing multipart upload ID");

                    const partCount = Math.ceil(size / partSize);
                    const parts: import("@aws-sdk/client-s3").CompletedPart[] = [];
                    let nextPartNumber = 1;
                    let copiedBytes = 0;
                    let failure: { error: unknown } | undefined;

                    const copyParts = async () => {
                        try {
                            while (nextPartNumber <= partCount) {
                                abortController.signal.throwIfAborted();
                                const partNumber = nextPartNumber++;
                                const start = (partNumber - 1) * partSize;
                                const end: number = Math.min(start + partSize, size) - 1;
                                const { awsS3Client } = await getAwsS3Client();
                                const result: import("@aws-sdk/client-s3").UploadPartCopyCommandOutput =
                                    await awsS3Client.send(
                                        new sdk.UploadPartCopyCommand({
                                            ...destination,
                                            ...source,
                                            UploadId: uploadId,
                                            PartNumber: partNumber,
                                            CopySourceRange: `bytes=${start}-${end}`
                                        }),
                                        { abortSignal: abortController.signal }
                                    );
                                assert(
                                    result.CopyPartResult?.ETag !== undefined,
                                    "Missing copied part ETag"
                                );
                                parts[partNumber - 1] = {
                                    ...result.CopyPartResult,
                                    PartNumber: partNumber
                                };
                                copiedBytes += end - start + 1;

                                if (!abortController.signal.aborted) {
                                    onCopyProgress({
                                        copyPercent: Math.min(
                                            99,
                                            Math.floor((copiedBytes / size) * 100)
                                        )
                                    });
                                }
                            }
                        } catch (error) {
                            failure ??= { error };
                            abortController.abort();
                        }
                    };

                    // Settle all in-flight parts before aborting an unfinished upload.
                    await Promise.all(
                        Array.from({ length: Math.min(4, partCount) }, copyParts)
                    );

                    if (failure !== undefined) {
                        throw failure.error;
                    }

                    abortController.signal.throwIfAborted();
                    const { awsS3Client: completionClient } = await getAwsS3Client();
                    abortController.signal.throwIfAborted();
                    // Once committing, wait for the result: cancellation can't undo it.
                    const result = await completionClient.send(
                        new sdk.CompleteMultipartUploadCommand({
                            ...destination,
                            UploadId: uploadId,
                            MultipartUpload: { Parts: parts }
                        })
                    );
                    assert(result.ETag !== undefined, "Missing completed copy ETag");
                }

                isCopyComplete = true;
                onCopyProgress({ copyPercent: 100 });
                return { status: "success" };
            } catch (error) {
                if (uploadId !== undefined && !isCopyComplete) {
                    try {
                        const { getAwsS3Client } = await prApi;
                        const { awsS3Client } = await getAwsS3Client();
                        const { AbortMultipartUploadCommand } = await import(
                            "@aws-sdk/client-s3"
                        );
                        await awsS3Client.send(
                            new AbortMultipartUploadCommand({
                                Bucket: destinationS3Uri.bucket,
                                Key: getS3UriKey(destinationS3Uri),
                                UploadId: uploadId
                            })
                        );
                    } catch (cleanupError) {
                        if (
                            !(cleanupError instanceof Error) ||
                            cleanupError.name !== "NoSuchUpload"
                        ) {
                            return {
                                status: "failed",
                                error: new Error(
                                    "Could not clean up the unfinished multipart copy",
                                    { cause: { copyError: error, cleanupError } }
                                )
                            };
                        }
                    }
                }

                return isCanceled
                    ? { status: "canceled" }
                    : {
                          status: "failed",
                          error: error instanceof Error ? error : new Error(String(error))
                      };
            } finally {
                ctx.done();
            }
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
        getSignedObjectHttpUrl: async ({
            s3Uri,
            validityDurationSecond,
            isForDirectDownload
        }) => {
            assert(
                !isAnonymousProfile,
                "Trying to generate signed url with public client"
            );

            const { getAwsS3Client } = await prApi;

            const { awsS3Client } = await getAwsS3Client();

            const downloadUrl = await (
                await import("@aws-sdk/s3-request-presigner")
            ).getSignedUrl(
                awsS3Client,
                new (await import("@aws-sdk/client-s3")).GetObjectCommand({
                    Bucket: s3Uri.bucket,
                    Key: getS3UriKey(s3Uri),
                    ResponseContentDisposition: isForDirectDownload
                        ? "attachment"
                        : undefined
                }),
                {
                    expiresIn: validityDurationSecond
                }
            );

            return downloadUrl;
        },
        createPresignedPost: async ({
            s3Uri,
            validityDurationSecond,
            maxObjectSizeInBytes
        }) => {
            assert(
                !isAnonymousProfile,
                "Trying to generate a presigned POST with a public client"
            );

            const { getAwsS3Client, getNewlyRequestedOrCachedToken } = await prApi;

            // This is the only recoverable boundary in this operation: obtaining
            // temporary credentials can fail when the identity or STS service is
            // unreachable. Signing the POST below is otherwise a local operation.
            const tokenResult = await getNewlyRequestedOrCachedToken().then(
                token => ({ isSuccess: true as const, token }),
                error => ({
                    isSuccess: false as const,
                    errorMessage: error instanceof Error ? error.message : String(error)
                })
            );

            if (!tokenResult.isSuccess) {
                return tokenResult;
            }

            const { token } = tokenResult;

            assert(token !== undefined);

            const { awsS3Client } = await getAwsS3Client({ token });

            const now = Date.now();
            const requestedExpirationTime = now + validityDurationSecond * 1_000;
            const expirationTime = Math.min(
                requestedExpirationTime,
                token.expirationTime ?? requestedExpirationTime
            );
            const expiresInSecond = Math.max(
                1,
                Math.floor((expirationTime - now) / 1_000)
            );

            const { url, fields } = await (
                await import("@aws-sdk/s3-presigned-post")
            ).createPresignedPost(awsS3Client, {
                Bucket: s3Uri.bucket,
                Key: `${getS3UriKey(s3Uri)}\${filename}`,
                Expires: expiresInSecond,
                Conditions:
                    maxObjectSizeInBytes === undefined
                        ? []
                        : [["content-length-range", 0, maxObjectSizeInBytes]]
            });

            return {
                isSuccess: true,
                presignedPost: {
                    url,
                    fields,
                    expirationTime: now + expiresInSecond * 1_000
                }
            };
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
                typeGuard<S3Client.BucketPolicies>(
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
