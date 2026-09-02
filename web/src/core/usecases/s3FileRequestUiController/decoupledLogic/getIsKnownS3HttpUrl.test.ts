import { describe, expect, it } from "vitest";
import type { S3Config } from "core/ports/OnyxiaApi/S3Config";
import { getIsKnownS3ServerUrl, parsePresignedPostUrl } from "./getIsKnownS3HttpUrl";

type Server = {
    url: string;
    pathStyleAccess: boolean;
};

function createS3Config(params: {
    servers?: Server[];
    defaultServer?: Server;
}): S3Config {
    const { servers = [], defaultServer } = params;

    return {
        entries: servers.map(
            ({ url, pathStyleAccess }, index): S3Config.Entry => ({
                url,
                pathStyleAccess,
                region: undefined,
                sts: undefined,
                anonymousProfileName: `anonymous-${index}`,
                bookmarks: []
            })
        ),
        defaultValuesOfCreationForm:
            defaultServer === undefined
                ? undefined
                : {
                      ...defaultServer,
                      region: undefined
                  }
    };
}

describe("parsePresignedPostUrl", () => {
    it.each([
        {
            name: "path-style URL",
            server: {
                url: "https://minio.lab.sspcloud.fr",
                pathStyleAccess: true
            },
            presignedPostUrl: "https://minio.lab.sspcloud.fr/garronej",
            expectedS3ServerUrl: "https://minio.lab.sspcloud.fr",
            expectedBucket: "garronej"
        },
        {
            name: "path-style URL with trailing slashes and query parameters",
            server: {
                url: "https://minio.lab.sspcloud.fr/",
                pathStyleAccess: true
            },
            presignedPostUrl: "https://minio.lab.sspcloud.fr/garronej/?x-id=PutObject",
            expectedS3ServerUrl: "https://minio.lab.sspcloud.fr",
            expectedBucket: "garronej"
        },
        {
            name: "URL with an explicit default port and an encoded bucket name",
            server: {
                url: "https://minio.lab.sspcloud.fr:443",
                pathStyleAccess: true
            },
            presignedPostUrl: "https://minio.lab.sspcloud.fr/%67arronej",
            expectedS3ServerUrl: "https://minio.lab.sspcloud.fr",
            expectedBucket: "garronej"
        },
        {
            name: "virtual-hosted-style URL",
            server: {
                url: "https://minio.lab.sspcloud.fr",
                pathStyleAccess: false
            },
            presignedPostUrl: "https://garronej.minio.lab.sspcloud.fr",
            expectedS3ServerUrl: "https://minio.lab.sspcloud.fr",
            expectedBucket: "garronej"
        },
        {
            name: "virtual-hosted-style URL with a dotted bucket",
            server: {
                url: "https://minio.lab.sspcloud.fr/",
                pathStyleAccess: false
            },
            presignedPostUrl: "https://my.bucket.minio.lab.sspcloud.fr/",
            expectedS3ServerUrl: "https://minio.lab.sspcloud.fr",
            expectedBucket: "my.bucket"
        },
        {
            name: "HTTP path-style URL with a non-default port",
            server: {
                url: "http://localhost:9000",
                pathStyleAccess: true
            },
            presignedPostUrl: "http://localhost:9000/local-bucket",
            expectedS3ServerUrl: "http://localhost:9000",
            expectedBucket: "local-bucket"
        },
        {
            name: "IPv6 path-style URL",
            server: {
                url: "http://[2001:db8::1]:9000",
                pathStyleAccess: true
            },
            presignedPostUrl: "http://[2001:db8::1]:9000/ipv6-bucket",
            expectedS3ServerUrl: "http://[2001:db8::1]:9000",
            expectedBucket: "ipv6-bucket"
        },
        {
            name: "path-style endpoint with a path prefix",
            server: {
                url: "https://gateway.example.com/object-storage/tenant-a/",
                pathStyleAccess: true
            },
            presignedPostUrl:
                "https://gateway.example.com/object-storage/tenant-a/data-bucket/",
            expectedS3ServerUrl: "https://gateway.example.com/object-storage/tenant-a",
            expectedBucket: "data-bucket"
        },
        {
            name: "virtual-hosted-style endpoint with a path prefix",
            server: {
                url: "https://gateway.example.com/object-storage/tenant-a/",
                pathStyleAccess: false
            },
            presignedPostUrl:
                "https://data-bucket.gateway.example.com/object-storage/tenant-a/",
            expectedS3ServerUrl: "https://gateway.example.com/object-storage/tenant-a",
            expectedBucket: "data-bucket"
        },
        {
            name: "AWS regional virtual-hosted-style URL",
            server: {
                url: "https://s3.us-east-1.amazonaws.com",
                pathStyleAccess: false
            },
            presignedPostUrl:
                "https://garronej.s3.us-east-1.amazonaws.com/?x-id=PutObject",
            expectedS3ServerUrl: "https://s3.us-east-1.amazonaws.com",
            expectedBucket: "garronej"
        }
    ])("parses a known $name", testCase => {
        const result = parsePresignedPostUrl({
            s3Config: createS3Config({ defaultServer: testCase.server }),
            presignedPost_url: testCase.presignedPostUrl
        });

        expect(result).toEqual({
            isKnownS3Server: true,
            s3ServerUrl: testCase.expectedS3ServerUrl,
            bucket: testCase.expectedBucket
        });
    });

    it("uses the most specific matching server hostname", () => {
        const result = parsePresignedPostUrl({
            s3Config: createS3Config({
                servers: [
                    { url: "https://example.com", pathStyleAccess: false },
                    { url: "https://s3.example.com", pathStyleAccess: false }
                ]
            }),
            presignedPost_url: "https://bucket.s3.example.com"
        });

        expect(result).toMatchObject({
            isKnownS3Server: true,
            s3ServerUrl: "https://s3.example.com",
            bucket: "bucket"
        });
    });

    it.each([
        ["an unknown server", "https://unknown.example.com/bucket"],
        ["a hostname-prefix attack", "https://minio.lab.sspcloud.fr.evil.test/bucket"],
        ["a user-info hostname attack", "https://minio.lab.sspcloud.fr@evil.test/bucket"],
        ["credentials on a known host", "https://user@minio.lab.sspcloud.fr/bucket"],
        ["a protocol mismatch", "http://minio.lab.sspcloud.fr/bucket"],
        ["a port mismatch", "https://minio.lab.sspcloud.fr:8443/bucket"],
        ["the server URL without a bucket", "https://minio.lab.sspcloud.fr"],
        ["an object path after the bucket", "https://minio.lab.sspcloud.fr/bucket/key"],
        ["an encoded slash in the bucket", "https://minio.lab.sspcloud.fr/a%2Fb"],
        ["a malformed URL", "not a URL"]
    ])("rejects %s", (_name, presignedPostUrl) => {
        const result = parsePresignedPostUrl({
            s3Config: createS3Config({
                defaultServer: {
                    url: "https://minio.lab.sspcloud.fr",
                    pathStyleAccess: true
                }
            }),
            presignedPost_url: presignedPostUrl
        });

        expect(result).toEqual({ isKnownS3Server: false });
    });

    it("rejects a URL whose addressing style differs from the configured style", () => {
        const config = createS3Config({
            defaultServer: {
                url: "https://minio.lab.sspcloud.fr",
                pathStyleAccess: false
            }
        });

        expect(
            parsePresignedPostUrl({
                s3Config: config,
                presignedPost_url: "https://minio.lab.sspcloud.fr/garronej"
            })
        ).toEqual({ isKnownS3Server: false });
    });
});

describe("getIsKnownS3ServerUrl", () => {
    const s3Config = createS3Config({
        defaultServer: {
            url: "https://minio.lab.sspcloud.fr/",
            pathStyleAccess: true
        }
    });

    it("recognizes the configured endpoint independently of a trailing slash", () => {
        expect(
            getIsKnownS3ServerUrl({
                s3Config,
                s3ServerUrl: "https://minio.lab.sspcloud.fr",
                pathStyleAccess: true
            })
        ).toBe(true);
    });

    it("does not use vulnerable string-prefix matching", () => {
        expect(
            getIsKnownS3ServerUrl({
                s3Config,
                s3ServerUrl: "https://minio.lab.sspcloud.fr.evil.test",
                pathStyleAccess: true
            })
        ).toBe(false);
    });

    it("requires the addressing style to match the configured server", () => {
        expect(
            getIsKnownS3ServerUrl({
                s3Config,
                s3ServerUrl: "https://minio.lab.sspcloud.fr",
                pathStyleAccess: false
            })
        ).toBe(false);
    });
});
