import { afterEach, describe, expect, it, vi } from "vitest";
import { assert } from "tsafe/assert";
import { parseS3Uri, type S3Uri } from "core/tools/S3Uri";
import { getObjectRendering } from "./objectRendering";

const directUrl = "https://example.com/object";

function parseObject(value: string): S3Uri.NonTerminatedByDelimiter {
    const s3Uri = parseS3Uri({ value, delimiter: "/" });

    assert(!s3Uri.isDelimiterTerminated);

    return s3Uri;
}

function createResponse(params: {
    body?: string;
    status?: number;
    headers?: Record<string, string>;
}) {
    const { body = null, status = 200, headers = {} } = params;

    return new Response(body, { status, headers });
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe(getObjectRendering.name, () => {
    it("renders JSON, CSV and parquet objects as datasets", async () => {
        const fetchMock = vi.fn(() =>
            Promise.resolve(
                createResponse({
                    headers: { "Content-Type": "application/octet-stream" }
                })
            )
        );

        vi.stubGlobal("fetch", fetchMock);

        const got = await getObjectRendering({
            s3Uri: parseObject("s3://mybucket/foo/dataset.parquet"),
            getDirectDownloadHttpUrl: () => Promise.resolve(directUrl)
        });

        expect(got).toStrictEqual({ renderAs: "dataset" });
        expect(fetchMock).toHaveBeenCalledOnce();
        expect(fetchMock).toHaveBeenCalledWith(directUrl, {
            method: "HEAD",
            redirect: "follow"
        });
    });

    it("falls back to the download button when HEAD is blocked", async () => {
        const fetchMock = vi.fn(() => Promise.reject(new TypeError("CORS")));
        const s3Uri = parseObject("s3://mybucket/foo/image.png");

        vi.stubGlobal("fetch", fetchMock);

        const got = await getObjectRendering({
            s3Uri,
            getDirectDownloadHttpUrl: () => Promise.resolve(directUrl)
        });

        expect(got).toStrictEqual({
            renderAs: "download button",
            s3Uri
        });
    });

    it("renders native image media types as images", async () => {
        const fetchMock = vi.fn(() =>
            Promise.resolve(
                createResponse({
                    headers: { "Content-Type": "image/png" }
                })
            )
        );

        vi.stubGlobal("fetch", fetchMock);

        const got = await getObjectRendering({
            s3Uri: parseObject("s3://mybucket/foo/object-without-extension"),
            getDirectDownloadHttpUrl: () => Promise.resolve(directUrl)
        });

        expect(got).toStrictEqual({ renderAs: "image", url: directUrl });
    });

    it("can still infer video from extension when the HEAD request returns an HTTP error", async () => {
        const fetchMock = vi.fn(() => Promise.resolve(createResponse({ status: 403 })));

        vi.stubGlobal("fetch", fetchMock);

        const got = await getObjectRendering({
            s3Uri: parseObject("s3://mybucket/foo/movie.mp4"),
            getDirectDownloadHttpUrl: () => Promise.resolve(directUrl)
        });

        expect(got).toStrictEqual({ renderAs: "video", url: directUrl });
    });

    it("renders PDF files as PDFs", async () => {
        const fetchMock = vi.fn(() =>
            Promise.resolve(
                createResponse({
                    headers: { "Content-Type": "application/octet-stream" }
                })
            )
        );

        vi.stubGlobal("fetch", fetchMock);

        const got = await getObjectRendering({
            s3Uri: parseObject("s3://mybucket/foo/document.pdf"),
            getDirectDownloadHttpUrl: () => Promise.resolve(directUrl)
        });

        expect(got).toStrictEqual({ renderAs: "pdf", url: directUrl });
    });

    it("renders PDF media types as PDFs without relying on the extension", async () => {
        const fetchMock = vi.fn(() =>
            Promise.resolve(
                createResponse({
                    headers: { "Content-Type": "application/pdf" }
                })
            )
        );

        vi.stubGlobal("fetch", fetchMock);

        const got = await getObjectRendering({
            s3Uri: parseObject("s3://mybucket/foo/object-without-extension"),
            getDirectDownloadHttpUrl: () => Promise.resolve(directUrl)
        });

        expect(got).toStrictEqual({ renderAs: "pdf", url: directUrl });
    });

    it("downloads small textual code and infers the editor language", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(
                createResponse({
                    headers: {
                        "Content-Type": "application/octet-stream",
                        "Content-Length": "12"
                    }
                })
            )
            .mockResolvedValueOnce(
                createResponse({
                    body: "print('x')\n",
                    headers: { "Content-Type": "application/octet-stream" }
                })
            );

        vi.stubGlobal("fetch", fetchMock);

        const got = await getObjectRendering({
            s3Uri: parseObject("s3://mybucket/foo/script.py"),
            getDirectDownloadHttpUrl: () => Promise.resolve(directUrl)
        });

        expect(got).toStrictEqual({
            renderAs: "code",
            language: "python",
            code: "print('x')\n"
        });
    });

    it("renders known textual media types as code with an undefined language when unknown", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(
                createResponse({
                    headers: {
                        "Content-Type": "text/plain",
                        "Content-Length": "11"
                    }
                })
            )
            .mockResolvedValueOnce(
                createResponse({
                    body: "plain text\n",
                    headers: { "Content-Type": "text/plain" }
                })
            );

        vi.stubGlobal("fetch", fetchMock);

        const got = await getObjectRendering({
            s3Uri: parseObject("s3://mybucket/foo/README"),
            getDirectDownloadHttpUrl: () => Promise.resolve(directUrl)
        });

        expect(got).toStrictEqual({
            renderAs: "code",
            language: undefined,
            code: "plain text\n"
        });
    });

    it("does not download code when HEAD reports it is over 1 MB", async () => {
        const fetchMock = vi.fn(() =>
            Promise.resolve(
                createResponse({
                    headers: {
                        "Content-Type": "text/typescript",
                        "Content-Length": "1000001"
                    }
                })
            )
        );
        const s3Uri = parseObject("s3://mybucket/foo/large.ts");

        vi.stubGlobal("fetch", fetchMock);

        const got = await getObjectRendering({
            s3Uri,
            getDirectDownloadHttpUrl: () => Promise.resolve(directUrl)
        });

        expect(got).toStrictEqual({
            renderAs: "download button",
            s3Uri
        });
        expect(fetchMock).toHaveBeenCalledOnce();
    });

    it("falls back to download when GET reports code is over 1 MB", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(
                createResponse({
                    headers: {
                        "Content-Type": "text/plain"
                    }
                })
            )
            .mockResolvedValueOnce(
                createResponse({
                    body: "should not be read",
                    headers: {
                        "Content-Type": "text/plain",
                        "Content-Length": "1000001"
                    }
                })
            );
        const s3Uri = parseObject("s3://mybucket/foo/large.txt");

        vi.stubGlobal("fetch", fetchMock);

        const got = await getObjectRendering({
            s3Uri,
            getDirectDownloadHttpUrl: () => Promise.resolve(directUrl)
        });

        expect(got).toStrictEqual({
            renderAs: "download button",
            s3Uri
        });
    });
});
