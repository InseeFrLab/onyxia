import { ZipWriter, type ZipWriterConstructorOptions } from "@zip.js/zip.js";
import type { S3Client } from "core/ports/S3Client";
import { getS3UriKey, stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";

type ZipEntryToDownload = {
    s3Uri: S3Uri.NonTerminatedByDelimiter;
    archivePath: string;
};

type DirectoryEntryToCreate = {
    archivePath: string;
};

type CrawlResult = {
    directories: S3Uri.TerminatedByDelimiter[];
    objects: S3Uri.NonTerminatedByDelimiter[];
};

const zipWriterOptions: ZipWriterConstructorOptions = {
    bufferedWrite: false,
    dataDescriptor: true,
    level: 0,
    useWebWorkers: false,
    zip64: true
};

const fallbackObjectUrlValidityDurationSecond = 60 * 60;

export async function downloadS3UrisAsZip(params: {
    s3Uris: S3Uri[];
    currentS3Uri: S3Uri;
    getS3Client: () => Promise<S3Client>;
}): Promise<void> {
    const { s3Uris, currentS3Uri, getS3Client } = params;

    if (s3Uris.length === 0) {
        return;
    }

    const writable = await promptForZipWritable({
        suggestedName: getZipFileName({ s3Uris, currentS3Uri })
    });

    try {
        const s3Client = await getS3Client();
        const { directories, objects } = await getEntriesToDownload({
            s3Client,
            s3Uris,
            currentS3Uri
        });

        const zipWriter = new ZipWriter(writable, zipWriterOptions);

        for (const directory of directories) {
            await zipWriter.add(directory.archivePath, undefined, {
                ...zipWriterOptions,
                directory: true
            });
        }

        for (const object of objects) {
            const stream = await getObjectReadableStream({
                s3Client,
                s3Uri: object.s3Uri
            });

            await zipWriter.add(object.archivePath, stream, zipWriterOptions);
        }

        await zipWriter.close(undefined, { zip64: true });
    } catch (error) {
        await writable.abort().catch(() => undefined);
        throw error;
    }
}

async function promptForZipWritable(params: {
    suggestedName: string;
}): Promise<WritableStream> {
    const { suggestedName } = params;

    const { default: streamSaver } = await import("streamsaver");

    streamSaver.mitm = getStreamSaverMitmUrl();

    return streamSaver.createWriteStream(suggestedName);
}

function getStreamSaverMitmUrl(): string {
    return `${import.meta.env.PUBLIC_URL}/streamsaver/mitm.html?version=2.0.0`;
}

async function getObjectReadableStream(params: {
    s3Client: S3Client;
    s3Uri: S3Uri.NonTerminatedByDelimiter;
}): Promise<ReadableStream> {
    const { s3Client, s3Uri } = params;

    const getObjectContent = getObjectContentIfAvailable({ s3Client });

    if (getObjectContent !== undefined) {
        try {
            const { stream } = await getObjectContent({
                s3Uri,
                range: undefined
            });

            return stream;
        } catch {
            // Some browser/S3 SDK combinations cannot expose GetObject bodies as
            // ReadableStreams. In that case, retry through a regular HTTP fetch.
        }
    }

    return getObjectReadableStreamFromHttpUrl({ s3Client, s3Uri });
}

function getObjectContentIfAvailable(params: {
    s3Client: S3Client;
}): S3Client["getObjectContent"] | undefined {
    const { s3Client } = params;

    const getObjectContent = (s3Client as Partial<Pick<S3Client, "getObjectContent">>)
        .getObjectContent;

    if (typeof getObjectContent !== "function") {
        return undefined;
    }

    return params => getObjectContent.call(s3Client, params);
}

async function getObjectReadableStreamFromHttpUrl(params: {
    s3Client: S3Client;
    s3Uri: S3Uri.NonTerminatedByDelimiter;
}): Promise<ReadableStream> {
    const { s3Client, s3Uri } = params;

    const response = await fetch(
        await getObjectHttpUrlForRead({
            s3Client,
            s3Uri
        })
    );

    if (!response.ok) {
        throw new Error(
            `Unable to download ${stringifyS3Uri(s3Uri)}: ${response.status} ${response.statusText}`
        );
    }

    if (response.body === null) {
        throw new Error(
            `Unable to download ${stringifyS3Uri(s3Uri)}: the response body is not readable.`
        );
    }

    return response.body;
}

async function getObjectHttpUrlForRead(params: {
    s3Client: S3Client;
    s3Uri: S3Uri.NonTerminatedByDelimiter;
}): Promise<string> {
    const { s3Client, s3Uri } = params;

    const token = await s3Client.getToken({ doForceRenew: false });

    if (token === undefined) {
        return s3Client.getUnsignedObjectHttpUrl({
            s3Uri,
            isForDirectDownload: false
        });
    }

    return s3Client.getSignedObjectHttpUrl({
        s3Uri,
        validityDurationSecond: fallbackObjectUrlValidityDurationSecond,
        isForDirectDownload: false
    });
}

async function getEntriesToDownload(params: {
    s3Client: S3Client;
    s3Uris: S3Uri[];
    currentS3Uri: S3Uri;
}): Promise<{
    directories: DirectoryEntryToCreate[];
    objects: ZipEntryToDownload[];
}> {
    const { s3Client, s3Uris, currentS3Uri } = params;
    const archiveRootKey = getArchiveRootKey({ s3Uris, currentS3Uri });

    const crawledEntries = (
        await Promise.all(
            s3Uris.map(async s3Uri => {
                if (!s3Uri.isDelimiterTerminated) {
                    return {
                        directories: [],
                        objects: [s3Uri]
                    } satisfies CrawlResult;
                }

                return crawlPrefix({
                    s3Client,
                    s3UriPrefix: s3Uri
                });
            })
        )
    ).reduce<CrawlResult>(
        (accumulator, crawlResult) => ({
            directories: [...accumulator.directories, ...crawlResult.directories],
            objects: [...accumulator.objects, ...crawlResult.objects]
        }),
        { directories: [], objects: [] }
    );

    const usedArchivePaths = new Set<string>();
    const seenObjectKeys = new Set<string>();
    const seenDirectoryKeys = new Set<string>();

    const directories = crawledEntries.directories.flatMap(
        (s3Uri): DirectoryEntryToCreate[] => {
            const s3UriKey = stringifyS3Uri(s3Uri);

            if (seenDirectoryKeys.has(s3UriKey)) {
                return [];
            }

            seenDirectoryKeys.add(s3UriKey);

            const archivePath = getArchivePath({
                archiveRootKey,
                s3Uri,
                isDirectory: true
            });

            if (archivePath === "") {
                return [];
            }

            return [
                {
                    archivePath: getUniqueArchivePath({
                        archivePath,
                        usedArchivePaths
                    })
                }
            ];
        }
    );

    const objects = crawledEntries.objects.flatMap((s3Uri): ZipEntryToDownload[] => {
        const s3UriKey = stringifyS3Uri(s3Uri);

        if (seenObjectKeys.has(s3UriKey)) {
            return [];
        }

        seenObjectKeys.add(s3UriKey);

        const archivePath = getArchivePath({
            archiveRootKey,
            s3Uri,
            isDirectory: false
        });

        if (archivePath === "") {
            return [];
        }

        return [
            {
                s3Uri,
                archivePath: getUniqueArchivePath({
                    archivePath,
                    usedArchivePaths
                })
            }
        ];
    });

    return { directories, objects };
}

async function crawlPrefix(params: {
    s3Client: S3Client;
    s3UriPrefix: S3Uri.TerminatedByDelimiter;
}): Promise<CrawlResult> {
    const { s3Client, s3UriPrefix } = params;

    const result = await s3Client.listObjects({ s3Uri: s3UriPrefix });

    if (!result.isSuccess) {
        throw new Error(
            `Unable to list ${stringifyS3Uri(s3UriPrefix)}: ${formatListObjectsErrorCase(
                result.errorCase
            )}`
        );
    }

    const nestedEntries = await Promise.all(
        result.prefixes.map(s3Uri =>
            crawlPrefix({
                s3Client,
                s3UriPrefix: s3Uri
            })
        )
    );

    return nestedEntries.reduce<CrawlResult>(
        (accumulator, crawlResult) => ({
            directories: [...accumulator.directories, ...crawlResult.directories],
            objects: [...accumulator.objects, ...crawlResult.objects]
        }),
        {
            directories: [s3UriPrefix],
            objects: result.objects.map(({ s3Uri }) => s3Uri)
        }
    );
}

function getArchiveRootKey(params: { s3Uris: S3Uri[]; currentS3Uri: S3Uri }): string {
    const { s3Uris, currentS3Uri } = params;

    if (s3Uris.length === 1) {
        const [s3Uri] = s3Uris;

        return getPrefixKeyFromKeySegments({
            keySegments: s3Uri.keySegments.slice(0, -1),
            delimiter: s3Uri.delimiter
        });
    }

    return getPrefixKeyFromKeySegments({
        keySegments: currentS3Uri.isDelimiterTerminated
            ? currentS3Uri.keySegments
            : currentS3Uri.keySegments.slice(0, -1),
        delimiter: currentS3Uri.delimiter
    });
}

function getPrefixKeyFromKeySegments(params: {
    keySegments: string[];
    delimiter: string;
}): string {
    const { keySegments, delimiter } = params;

    if (keySegments.length === 0) {
        return "";
    }

    return `${keySegments.join(delimiter)}${delimiter}`;
}

function getArchivePath(params: {
    archiveRootKey: string;
    s3Uri: S3Uri;
    isDirectory: boolean;
}): string {
    const { archiveRootKey, s3Uri, isDirectory } = params;

    const s3UriKey = getS3UriKey(s3Uri);
    const relativePath =
        archiveRootKey !== "" && s3UriKey.startsWith(archiveRootKey)
            ? s3UriKey.slice(archiveRootKey.length)
            : s3UriKey;

    return sanitizeArchivePath({
        path: relativePath,
        isDirectory
    });
}

function sanitizeArchivePath(params: { path: string; isDirectory: boolean }): string {
    const { path, isDirectory } = params;

    const sanitizedPath = path
        .replace(/\\/g, "/")
        .split("/")
        .filter(pathSegment => pathSegment !== "")
        .map(pathSegment => {
            const sanitizedPathSegment = pathSegment.replace(/\0/g, "_");

            if (sanitizedPathSegment === ".") {
                return "_";
            }

            if (sanitizedPathSegment === "..") {
                return "__";
            }

            return sanitizedPathSegment;
        })
        .join("/");

    if (!isDirectory || sanitizedPath === "") {
        return sanitizedPath;
    }

    return sanitizedPath.endsWith("/") ? sanitizedPath : `${sanitizedPath}/`;
}

function getUniqueArchivePath(params: {
    archivePath: string;
    usedArchivePaths: Set<string>;
}): string {
    const { archivePath, usedArchivePaths } = params;

    if (!usedArchivePaths.has(archivePath)) {
        usedArchivePaths.add(archivePath);
        return archivePath;
    }

    const isDirectory = archivePath.endsWith("/");
    const pathWithoutTrailingSlash = isDirectory ? archivePath.slice(0, -1) : archivePath;
    const lastSlashIndex = pathWithoutTrailingSlash.lastIndexOf("/");
    const dirname =
        lastSlashIndex === -1
            ? ""
            : pathWithoutTrailingSlash.slice(0, lastSlashIndex + 1);
    const basename =
        lastSlashIndex === -1
            ? pathWithoutTrailingSlash
            : pathWithoutTrailingSlash.slice(lastSlashIndex + 1);
    const extensionStartIndex = isDirectory ? -1 : basename.lastIndexOf(".");
    const stem =
        extensionStartIndex <= 0 ? basename : basename.slice(0, extensionStartIndex);
    const extension = extensionStartIndex <= 0 ? "" : basename.slice(extensionStartIndex);

    let index = 2;

    while (true) {
        const candidate = `${dirname}${stem} (${index})${extension}${isDirectory ? "/" : ""}`;

        if (!usedArchivePaths.has(candidate)) {
            usedArchivePaths.add(candidate);
            return candidate;
        }

        index++;
    }
}

function getZipFileName(params: { s3Uris: S3Uri[]; currentS3Uri: S3Uri }): string {
    const { s3Uris, currentS3Uri } = params;
    const labelSource = s3Uris.length === 1 ? s3Uris[0] : currentS3Uri;
    const label = labelSource.keySegments.at(-1) ?? labelSource.bucket;
    const basename = sanitizeFileBasename(label);

    return basename.toLowerCase().endsWith(".zip") ? basename : `${basename}.zip`;
}

function sanitizeFileBasename(basename: string): string {
    const sanitizedBasename = basename
        .replace(/[\0<>:"/\\|?*]/g, "_")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^\.+|\.+$/g, "");

    return sanitizedBasename === "" ? "s3-download" : sanitizedBasename;
}

function formatListObjectsErrorCase(
    errorCase: S3Client.ListObjectsReturn.Error["errorCase"]
): string {
    switch (errorCase) {
        case "access denied":
            return "access denied";
        case "no such bucket":
            return "bucket not found";
    }
}
