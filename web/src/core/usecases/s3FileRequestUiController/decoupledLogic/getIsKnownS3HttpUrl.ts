import type { S3Config } from "core/ports/OnyxiaApi/S3Config";

export function parsePresignedPostUrl(params: {
    s3Config: S3Config;
    presignedPost_url: string;
}):
    | { isKnownS3Server: false }
    | { isKnownS3Server: true; s3ServerUrl: string; bucket: string } {
    const { s3Config, presignedPost_url } = params;

    const presignedPostUrl = parseHttpUrl(presignedPost_url);

    if (presignedPostUrl === undefined || hasCredentials(presignedPostUrl)) {
        return { isKnownS3Server: false };
    }

    const parsedKnownS3Servers = getKnownS3Servers(s3Config)
        .map(({ pathStyleAccess, url }) => {
            const parsedUrl = parseHttpUrl(url);

            if (
                parsedUrl === undefined ||
                hasCredentials(parsedUrl) ||
                parsedUrl.search !== "" ||
                parsedUrl.hash !== ""
            ) {
                return undefined;
            }

            const endpointPathname = removeTrailingSlashes(parsedUrl.pathname);

            return {
                pathStyleAccess,
                parsedUrl,
                endpointPathname,
                s3ServerUrl: `${parsedUrl.origin}${endpointPathname}`
            };
        })
        .filter(server => server !== undefined)
        .sort(
            (a, b) =>
                b.parsedUrl.hostname.length - a.parsedUrl.hostname.length ||
                b.endpointPathname.length - a.endpointPathname.length
        );

    for (const knownS3Server of parsedKnownS3Servers) {
        const bucket = knownS3Server.pathStyleAccess
            ? getPathStyleBucket({
                  presignedPostUrl,
                  serverUrl: knownS3Server.parsedUrl,
                  endpointPathname: knownS3Server.endpointPathname
              })
            : getVirtualHostedStyleBucket({
                  presignedPostUrl,
                  serverUrl: knownS3Server.parsedUrl,
                  endpointPathname: knownS3Server.endpointPathname
              });

        if (bucket === undefined) {
            continue;
        }

        return {
            isKnownS3Server: true,
            s3ServerUrl: knownS3Server.s3ServerUrl,
            bucket
        };
    }

    return { isKnownS3Server: false };
}

export function getIsKnownS3ServerUrl(params: {
    s3Config: S3Config;
    s3ServerUrl: string;
    pathStyleAccess: boolean;
}): boolean {
    const { s3Config, s3ServerUrl, pathStyleAccess } = params;

    const candidateUrl = parseHttpUrl(s3ServerUrl);

    if (
        candidateUrl === undefined ||
        hasCredentials(candidateUrl) ||
        candidateUrl.search !== "" ||
        candidateUrl.hash !== ""
    ) {
        return false;
    }

    const candidateEndpoint = `${candidateUrl.origin}${removeTrailingSlashes(
        candidateUrl.pathname
    )}`;

    return getKnownS3Servers(s3Config).some(server => {
        if (server.pathStyleAccess !== pathStyleAccess) {
            return false;
        }

        const knownS3Server = parseHttpUrl(server.url);

        if (
            knownS3Server === undefined ||
            hasCredentials(knownS3Server) ||
            knownS3Server.search !== "" ||
            knownS3Server.hash !== ""
        ) {
            return false;
        }

        return (
            `${knownS3Server.origin}${removeTrailingSlashes(knownS3Server.pathname)}` ===
            candidateEndpoint
        );
    });
}

function getKnownS3Servers(
    s3Config: S3Config
): { pathStyleAccess: boolean; url: string }[] {
    return [
        ...s3Config.entries,
        ...(s3Config.defaultValuesOfCreationForm === undefined
            ? []
            : [
                  {
                      pathStyleAccess:
                          s3Config.defaultValuesOfCreationForm.pathStyleAccess,
                      url: s3Config.defaultValuesOfCreationForm.url
                  }
              ])
    ];
}

function getPathStyleBucket(params: {
    presignedPostUrl: URL;
    serverUrl: URL;
    endpointPathname: string;
}): string | undefined {
    const { presignedPostUrl, serverUrl, endpointPathname } = params;

    if (!haveSameConnectionTarget(presignedPostUrl, serverUrl)) {
        return undefined;
    }

    const bucketPathPrefix = `${endpointPathname}/`;

    if (!presignedPostUrl.pathname.startsWith(bucketPathPrefix)) {
        return undefined;
    }

    const bucketPath = presignedPostUrl.pathname.slice(bucketPathPrefix.length);
    const match = bucketPath.match(/^([^/]+)\/?$/);

    if (match === null) {
        return undefined;
    }

    return decodeBucket(match[1]);
}

function getVirtualHostedStyleBucket(params: {
    presignedPostUrl: URL;
    serverUrl: URL;
    endpointPathname: string;
}): string | undefined {
    const { presignedPostUrl, serverUrl, endpointPathname } = params;

    if (
        presignedPostUrl.protocol !== serverUrl.protocol ||
        presignedPostUrl.port !== serverUrl.port ||
        removeTrailingSlashes(presignedPostUrl.pathname) !== endpointPathname
    ) {
        return undefined;
    }

    const serverHostnameSuffix = `.${serverUrl.hostname}`;

    if (!presignedPostUrl.hostname.endsWith(serverHostnameSuffix)) {
        return undefined;
    }

    const bucket = presignedPostUrl.hostname.slice(0, -serverHostnameSuffix.length);

    return bucket === "" ? undefined : bucket;
}

function parseHttpUrl(value: string): URL | undefined {
    let url: URL;

    try {
        url = new URL(value);
    } catch {
        return undefined;
    }

    return url.protocol === "http:" || url.protocol === "https:" ? url : undefined;
}

function haveSameConnectionTarget(a: URL, b: URL): boolean {
    return a.protocol === b.protocol && a.hostname === b.hostname && a.port === b.port;
}

function hasCredentials(url: URL): boolean {
    return url.username !== "" || url.password !== "";
}

function removeTrailingSlashes(pathname: string): string {
    return pathname.replace(/\/+$/, "");
}

function decodeBucket(encodedBucket: string | undefined): string | undefined {
    if (encodedBucket === undefined) {
        return undefined;
    }

    let bucket: string;

    try {
        bucket = decodeURIComponent(encodedBucket);
    } catch {
        return undefined;
    }

    return bucket === "" || bucket.includes("/") || bucket.includes("\\")
        ? undefined
        : bucket;
}
