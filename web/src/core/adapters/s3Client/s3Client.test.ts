import { beforeEach, describe, expect, it, vi } from "vitest";
import { Readable } from "node:stream";
import { Evt } from "evt";
import {
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    CopyObjectCommand,
    CreateMultipartUploadCommand,
    GetObjectTaggingCommand,
    HeadObjectCommand,
    S3Client as AwsS3Client,
    S3ServiceException,
    UploadPartCopyCommand,
    type HeadObjectCommandOutput
} from "@aws-sdk/client-s3";
import type { S3Client } from "core/ports/S3Client";
import { createS3Client } from "./s3Client";

type Request = {
    input: Record<string, unknown>;
};
type RequestOptions = { abortSignal?: AbortSignal };
type Response = Record<string, unknown>;
type HttpRequest = Parameters<
    import("@aws-sdk/client-s3").S3ClientResolvedConfig["requestHandler"]["handle"]
>[0];

const { send } = vi.hoisted(() => ({
    send: vi.fn<(command: Request, options?: RequestOptions) => Promise<Response>>()
}));

vi.mock("@aws-sdk/client-s3", async importOriginal => ({
    ...(await importOriginal<typeof import("@aws-sdk/client-s3")>()),
    S3Client: vi.fn().mockImplementation(() => ({ send }))
}));

const GiB = 1024 ** 3;
const MiB = 1024 ** 2;
let head: Omit<HeadObjectCommandOutput, "$metadata">;
let params: Parameters<S3Client["copyObject"]>[0];

function copyObject() {
    return createS3Client(
        {
            url: "https://s3.example.test",
            pathStyleAccess: true,
            region: undefined,
            isStsEnabled: false,
            credentials: {
                accessKeyId: "test-access-key",
                secretAccessKey: "test-secret-key",
                sessionToken: undefined
            }
        },
        async () => {
            throw new Error("Static credentials should not request OIDC");
        }
    ).copyObject(params);
}

function respond(command: Request): Promise<Response> {
    if (command instanceof HeadObjectCommand) {
        return Promise.resolve(head);
    }
    if (command instanceof CopyObjectCommand) {
        return Promise.resolve({ CopyObjectResult: { ETag: '"destination"' } });
    }
    if (command instanceof GetObjectTaggingCommand) {
        return Promise.resolve({ TagSet: [] });
    }
    if (command instanceof CreateMultipartUploadCommand) {
        return Promise.resolve({ UploadId: "upload-id" });
    }
    if (command instanceof UploadPartCopyCommand) {
        return Promise.resolve({
            CopyPartResult: {
                ETag: `"part-${command.input.PartNumber}"`,
                ChecksumCRC32: "part-checksum"
            }
        });
    }
    if (command instanceof CompleteMultipartUploadCommand) {
        return Promise.resolve({ ETag: '"destination"' });
    }
    if (command instanceof AbortMultipartUploadCommand) {
        return Promise.resolve({});
    }
    throw new Error(`Unexpected S3 operation: ${command.constructor.name}`);
}

function progress() {
    return vi.mocked(params.onCopyProgress).mock.calls.map(([p]) => p.copyPercent);
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

beforeEach(() => {
    send.mockReset().mockImplementation(respond);
    head = {
        ContentLength: 123,
        ETag: '"source"',
        ContentType: "text/csv",
        Metadata: { project: "test" }
    };
    params = {
        sourceS3Uri: {
            bucket: "source-bucket",
            delimiter: "/",
            keySegments: ["folder", "report.csv"],
            isDelimiterTerminated: false
        },
        destinationS3Uri: {
            bucket: "destination-bucket",
            delimiter: "/",
            keySegments: ["new-folder", "renamed.csv"],
            isDelimiterTerminated: false
        },
        onCopyProgress: vi.fn(),
        evtCancel: Evt.create<void>()
    };
});

describe("S3Client.copyObject", () => {
    it.each([0, 123, 5 * GiB])("copies a %i-byte object in one request", async size => {
        head.ContentLength = size;

        expect(await copyObject()).toEqual({ status: "success" });
        expect(send.mock.calls.map(([command]) => command.constructor)).toEqual([
            HeadObjectCommand,
            CopyObjectCommand
        ]);
        expect(send.mock.calls[1][0].input).toEqual({
            Bucket: "destination-bucket",
            Key: "new-folder/renamed.csv",
            CopySource: "source-bucket/folder/report.csv",
            CopySourceIfMatch: '"source"',
            MetadataDirective: "COPY",
            TaggingDirective: "COPY"
        });
        expect(progress()).toEqual([0, 100]);
        expect(params.evtCancel.getHandlers()).toHaveLength(0);
    });

    it("encodes source keys and version IDs without encoding the destination key", async () => {
        params.sourceS3Uri.keySegments[1] = "résumé #?%+.csv";
        params.destinationS3Uri.keySegments[1] = "copy #?.csv";
        head.VersionId = "version/1+=";

        expect(await copyObject()).toEqual({ status: "success" });
        expect(send.mock.calls[1][0].input).toMatchObject({
            Key: "new-folder/copy #?.csv",
            CopySource:
                "source-bucket/folder/r%C3%A9sum%C3%A9%20%23%3F%25%2B.csv?versionId=version%2F1%2B%3D"
        });
    });

    it("copies every byte of a large object and orders parts even when they finish out of order", async () => {
        const size = 5 * GiB + 1;
        head.ContentLength = size;
        head.VersionId = "source-version";
        const firstPart = deferred<Response>();
        send.mockImplementation(command =>
            command instanceof UploadPartCopyCommand && command.input.PartNumber === 1
                ? firstPart.promise
                : respond(command)
        );

        const result = copyObject();
        const expectedPartCount = Math.ceil(size / (64 * MiB));
        await vi.waitFor(() => {
            expect(
                send.mock.calls.filter(([c]) => c instanceof UploadPartCopyCommand)
            ).toHaveLength(expectedPartCount);
        });
        expect(progress()).not.toContain(100);
        expect(
            send.mock.calls.some(([c]) => c instanceof CompleteMultipartUploadCommand)
        ).toBe(false);
        firstPart.resolve({
            CopyPartResult: { ETag: '"part-1"', ChecksumCRC32: "part-checksum" }
        });
        expect(await result).toEqual({ status: "success" });

        let nextByte = 0;
        for (const [command] of send.mock.calls) {
            if (!(command instanceof UploadPartCopyCommand)) {
                continue;
            }
            const range = /^bytes=(\d+)-(\d+)$/.exec(command.input.CopySourceRange!);
            expect(range).not.toBeNull();
            expect(Number(range![1])).toBe(nextByte);
            nextByte = Number(range![2]) + 1;
            expect(command.input.CopySource).toBe(
                "source-bucket/folder/report.csv?versionId=source-version"
            );
            expect(command.input.CopySourceIfMatch).toBe('"source"');
        }
        expect(nextByte).toBe(size);
        const complete = send.mock.calls.find(
            ([c]) => c instanceof CompleteMultipartUploadCommand
        )![0];
        if (!(complete instanceof CompleteMultipartUploadCommand)) {
            throw new Error("Expected multipart completion");
        }
        expect(complete.input.MultipartUpload?.Parts).toEqual(
            Array.from({ length: expectedPartCount }, (_, i) => ({
                PartNumber: i + 1,
                ETag: `"part-${i + 1}"`,
                ChecksumCRC32: "part-checksum"
            }))
        );
        const percentages = progress();
        expect(percentages).toEqual([...percentages].sort((a, b) => a - b));
        expect(percentages.at(-1)).toBe(100);
        expect(percentages.slice(0, -1).every(value => value <= 99)).toBe(true);
    });

    it("preserves content metadata and tags when creating a multipart copy", async () => {
        Object.assign(head, {
            ContentLength: 5 * GiB + 1,
            VersionId: "version",
            CacheControl: "max-age=123",
            ContentDisposition: "attachment; filename=report.csv",
            ContentEncoding: "gzip",
            ContentLanguage: "fr",
            Expires: new Date("2030-01-01"),
            WebsiteRedirectLocation: "/report"
        });
        send.mockImplementation(command =>
            command instanceof GetObjectTaggingCommand
                ? Promise.resolve({ TagSet: [{ Key: "project &", Value: "a=b /" }] })
                : respond(command)
        );

        expect(await copyObject()).toEqual({ status: "success" });
        expect(
            send.mock.calls.find(([c]) => c instanceof GetObjectTaggingCommand)![0].input
        ).toMatchObject({
            Bucket: "source-bucket",
            Key: "folder/report.csv",
            VersionId: "version"
        });
        expect(
            send.mock.calls.find(([c]) => c instanceof CreateMultipartUploadCommand)![0]
                .input
        ).toMatchObject({
            Bucket: "destination-bucket",
            Key: "new-folder/renamed.csv",
            CacheControl: head.CacheControl,
            ContentType: head.ContentType,
            ContentDisposition: head.ContentDisposition,
            ContentEncoding: head.ContentEncoding,
            ContentLanguage: head.ContentLanguage,
            Expires: head.Expires,
            Metadata: head.Metadata,
            WebsiteRedirectLocation: head.WebsiteRedirectLocation,
            Tagging: "project%20%26=a%3Db%20%2F"
        });
    });

    it("supports providers that don't implement object tagging", async () => {
        head.ContentLength = 5 * GiB + 1;
        const error = new S3ServiceException({
            name: "NotImplemented",
            $fault: "server",
            $metadata: { httpStatusCode: 501 }
        });
        send.mockImplementation(command =>
            command instanceof GetObjectTaggingCommand
                ? Promise.reject(error)
                : respond(command)
        );

        expect(await copyObject()).toEqual({ status: "success" });
    });

    it("fails rather than silently dropping tags when reading them is forbidden", async () => {
        head.ContentLength = 5 * GiB + 1;
        const error = new Error("Access denied");
        send.mockImplementation(command =>
            command instanceof GetObjectTaggingCommand
                ? Promise.reject(error)
                : respond(command)
        );

        expect(await copyObject()).toEqual({ status: "failed", error });
        expect(
            send.mock.calls.some(([c]) => c instanceof CreateMultipartUploadCommand)
        ).toBe(false);
    });

    it("rejects copying an object onto itself before issuing requests", async () => {
        params.destinationS3Uri = { ...params.sourceS3Uri };
        expect(await copyObject()).toMatchObject({
            status: "failed",
            error: expect.any(Error)
        });
        expect(send).not.toHaveBeenCalled();
    });

    it("does nothing when cancellation was already requested", async () => {
        (params.evtCancel as Evt<void>).post();
        expect(await copyObject()).toEqual({ status: "canceled" });
        expect(send).not.toHaveBeenCalled();
        expect(progress()).toEqual([]);
    });

    it("aborts an in-flight request and detaches the cancellation listener", async () => {
        send.mockImplementation(
            (_command, options) =>
                new Promise((_resolve, reject) => {
                    options!.abortSignal!.addEventListener("abort", () =>
                        reject(new DOMException("Canceled", "AbortError"))
                    );
                })
        );
        const result = copyObject();
        await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
        (params.evtCancel as Evt<void>).post();

        expect(await result).toEqual({ status: "canceled" });
        expect(send.mock.calls[0][1]?.abortSignal?.aborted).toBe(true);
        expect(progress()).toEqual([0]);
        expect(params.evtCancel.getHandlers()).toHaveLength(0);
    });

    it("cleans up the upload ID if canceled while initiating a multipart copy", async () => {
        head.ContentLength = 5 * GiB + 1;
        const initiation = deferred<Response>();
        send.mockImplementation(command =>
            command instanceof CreateMultipartUploadCommand
                ? initiation.promise
                : respond(command)
        );
        const result = copyObject();
        await vi.waitFor(() =>
            expect(
                send.mock.calls.some(([c]) => c instanceof CreateMultipartUploadCommand)
            ).toBe(true)
        );
        (params.evtCancel as Evt<void>).post();
        initiation.resolve({ UploadId: "upload-id" });

        expect(await result).toEqual({ status: "canceled" });
        expect(send.mock.calls.some(([c]) => c instanceof UploadPartCopyCommand)).toBe(
            false
        );
        const abort = send.mock.calls.find(
            ([c]) => c instanceof AbortMultipartUploadCommand
        )!;
        expect(abort[0].input).toEqual({
            Bucket: "destination-bucket",
            Key: "new-folder/renamed.csv",
            UploadId: "upload-id"
        });
        expect(abort[1]?.abortSignal).toBeUndefined();
    });

    it.each(["failure", "cancellation"])(
        "settles concurrent parts before cleanup on %s",
        async outcome => {
            head.ContentLength = 5 * GiB + 1;
            const failure = new Error("Part failed");
            const firstPart = deferred<Response>();
            let inFlight = 0;
            let maximumInFlight = 0;
            send.mockImplementation((command, options) => {
                if (command instanceof AbortMultipartUploadCommand) {
                    expect(inFlight).toBe(0);
                }
                if (!(command instanceof UploadPartCopyCommand)) {
                    return respond(command);
                }
                inFlight++;
                maximumInFlight = Math.max(maximumInFlight, inFlight);
                const result =
                    command.input.PartNumber === 1
                        ? firstPart.promise
                        : new Promise<Response>((_resolve, reject) => {
                              options!.abortSignal!.addEventListener("abort", () =>
                                  reject(new DOMException("Canceled", "AbortError"))
                              );
                          });
                return result.finally(() => inFlight--);
            });
            const result = copyObject();
            await vi.waitFor(() => expect(inFlight).toBe(4));
            if (outcome === "cancellation") {
                (params.evtCancel as Evt<void>).post();
                firstPart.reject(new DOMException("Canceled", "AbortError"));
            } else {
                firstPart.reject(failure);
            }

            expect(await result).toEqual(
                outcome === "cancellation"
                    ? { status: "canceled" }
                    : { status: "failed", error: failure }
            );
            expect(maximumInFlight).toBe(4);
            expect(
                send.mock.calls.some(([c]) => c instanceof AbortMultipartUploadCommand)
            ).toBe(true);
            expect(
                send.mock.calls.some(([c]) => c instanceof CompleteMultipartUploadCommand)
            ).toBe(false);
            expect(progress()).not.toContain(100);
            expect(params.evtCancel.getHandlers()).toHaveLength(0);
        }
    );

    it("reports cleanup failures together with the original failure", async () => {
        head.ContentLength = 5 * GiB + 1;
        const copyError = new Error("Copy failed");
        const cleanupError = new Error("Cleanup forbidden");
        send.mockImplementation(command => {
            if (command instanceof UploadPartCopyCommand) {
                return Promise.reject(copyError);
            }
            if (command instanceof AbortMultipartUploadCommand) {
                return Promise.reject(cleanupError);
            }
            return respond(command);
        });

        const result = await copyObject();
        expect(result.status).toBe("failed");
        if (result.status === "failed") {
            expect(result.error.cause).toEqual({ copyError, cleanupError });
        }
    });

    it("aborts a multipart copy when completion fails", async () => {
        head.ContentLength = 5 * GiB + 1;
        const error = new Error("Completion failed");
        send.mockImplementation(command =>
            command instanceof CompleteMultipartUploadCommand
                ? Promise.reject(error)
                : respond(command)
        );

        expect(await copyObject()).toEqual({ status: "failed", error });
        expect(send.mock.calls.at(-1)![0]).toBeInstanceOf(AbortMultipartUploadCommand);
        expect(progress()).not.toContain(100);
    });

    it("reports success if cancellation arrives after the multipart commit starts", async () => {
        head.ContentLength = 5 * GiB + 1;
        const completion = deferred<Response>();
        send.mockImplementation(command =>
            command instanceof CompleteMultipartUploadCommand
                ? completion.promise
                : respond(command)
        );
        const result = copyObject();
        await vi.waitFor(() =>
            expect(
                send.mock.calls.some(([c]) => c instanceof CompleteMultipartUploadCommand)
            ).toBe(true)
        );
        (params.evtCancel as Evt<void>).post();
        completion.resolve({ ETag: '"destination"' });

        expect(await result).toEqual({ status: "success" });
        expect(progress().at(-1)).toBe(100);
        expect(
            send.mock.calls.some(([c]) => c instanceof AbortMultipartUploadCommand)
        ).toBe(false);
    });

    it.each([undefined, -1, NaN, 1.5, 5 * GiB * 10_000 + 1])(
        "rejects invalid or unsupported source size %s",
        async size => {
            head.ContentLength = size;
            expect(await copyObject()).toMatchObject({
                status: "failed",
                error: expect.any(Error)
            });
            expect(send).toHaveBeenCalledTimes(1);
        }
    );

    it("increases the part size to stay within the 10,000-part limit", async () => {
        head.ContentLength = 1024 * GiB;
        send.mockImplementation(command =>
            command instanceof UploadPartCopyCommand
                ? Promise.reject(new Error("Stop after inspecting the first part"))
                : respond(command)
        );

        expect(await copyObject()).toMatchObject({ status: "failed" });
        const firstPart = send.mock.calls.find(
            ([c]) => c instanceof UploadPartCopyCommand
        )![0];
        expect(firstPart.input.CopySourceRange).toBe(
            `bytes=0-${Math.ceil(head.ContentLength / 10_000) - 1}`
        );
    });

    it("returns copy errors without deleting the source or reporting completion", async () => {
        const error = new Error("Source changed: precondition failed");
        send.mockImplementation(command =>
            command instanceof CopyObjectCommand
                ? Promise.reject(error)
                : respond(command)
        );

        expect(await copyObject()).toEqual({ status: "failed", error });
        expect(send.mock.calls.map(([command]) => command.constructor)).toEqual([
            HeadObjectCommand,
            CopyObjectCommand
        ]);
        expect(progress()).toEqual([0]);
        expect(params.evtCancel.getHandlers()).toHaveLength(0);
    });

    it("serializes multipart copy requests through the real SDK without transferring object bodies", async () => {
        const sdk =
            await vi.importActual<typeof import("@aws-sdk/client-s3")>(
                "@aws-sdk/client-s3"
            );
        const requestMethods: string[] = [];
        vi.mocked(AwsS3Client).mockImplementationOnce(
            (config = {}) =>
                new sdk.S3Client({
                    ...config,
                    requestHandler: {
                        handle: async (request: HttpRequest) => {
                            requestMethods.push(request.method);
                            const headers: Record<string, string> = {};
                            let xml: string;
                            if (request.method === "HEAD") {
                                Object.assign(headers, {
                                    "content-length": String(5 * GiB + 1),
                                    etag: '"source"',
                                    "content-type": "text/csv",
                                    "x-amz-meta-project": "test"
                                });
                                xml = "";
                            } else if (request.method === "GET") {
                                expect(request.query).toHaveProperty("tagging");
                                xml =
                                    "<Tagging><TagSet><Tag><Key>project</Key><Value>test</Value></Tag></TagSet></Tagging>";
                            } else if (request.query.uploads !== undefined) {
                                expect(request.headers["x-amz-meta-project"]).toBe(
                                    "test"
                                );
                                expect(request.headers["x-amz-tagging"]).toBe(
                                    "project=test"
                                );
                                xml =
                                    "<InitiateMultipartUploadResult><UploadId>wire-upload</UploadId></InitiateMultipartUploadResult>";
                            } else if (request.method === "PUT") {
                                expect(request.headers["x-amz-copy-source"]).toBe(
                                    "source-bucket/folder/report.csv"
                                );
                                expect(
                                    request.headers["x-amz-copy-source-if-match"]
                                ).toBe('"source"');
                                expect(request.body).toBeUndefined();
                                xml = `<CopyPartResult><ETag>&quot;part-${request.query.partNumber}&quot;</ETag><ChecksumCRC32>AAAAAA==</ChecksumCRC32></CopyPartResult>`;
                            } else {
                                expect(request.method).toBe("POST");
                                expect(request.query.uploadId).toBe("wire-upload");
                                expect(String(request.body)).toContain(
                                    "<ChecksumCRC32>AAAAAA==</ChecksumCRC32>"
                                );
                                xml =
                                    "<CompleteMultipartUploadResult><ETag>&quot;destination&quot;</ETag></CompleteMultipartUploadResult>";
                            }
                            return {
                                response: {
                                    statusCode: 200,
                                    headers,
                                    body: Readable.from([new TextEncoder().encode(xml)])
                                }
                            };
                        }
                    }
                })
        );

        expect(await copyObject()).toEqual({ status: "success" });
        expect(requestMethods.filter(method => method === "PUT")).toHaveLength(81);
        expect(progress().at(-1)).toBe(100);
    });

    it("handles a copy error embedded in a 200 response through the real SDK", async () => {
        const sdk =
            await vi.importActual<typeof import("@aws-sdk/client-s3")>(
                "@aws-sdk/client-s3"
            );
        vi.mocked(AwsS3Client).mockImplementationOnce(
            (config = {}) =>
                new sdk.S3Client({
                    ...config,
                    maxAttempts: 1,
                    requestHandler: {
                        handle: async (request: HttpRequest) => ({
                            response: {
                                statusCode: 200,
                                headers:
                                    request.method === "HEAD"
                                        ? { "content-length": "123", etag: '"source"' }
                                        : {},
                                body: Readable.from([
                                    new TextEncoder().encode(
                                        request.method === "HEAD"
                                            ? ""
                                            : "<Error><Code>InvalidRequest</Code><Message>Copy rejected</Message></Error>"
                                    )
                                ])
                            }
                        })
                    }
                })
        );

        const result = await copyObject();
        expect(result).toMatchObject({
            status: "failed",
            error: { name: "InvalidRequest", message: "Copy rejected" }
        });
        expect(progress()).toEqual([0]);
    });
});
