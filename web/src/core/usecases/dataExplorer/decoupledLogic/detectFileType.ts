import { isValidFileType } from "./fileType";

export function detectFileTypeFromSourceUrlExtension(sourceUrl: string) {
    let pathname: string;

    try {
        pathname = new URL(sourceUrl).pathname;
    } catch {
        return undefined;
    }
    const match = pathname.match(/\.(\w+)$/);

    if (match === null) {
        return undefined;
    }

    const [, extension] = match;

    return isValidFileType(extension) ? extension : undefined;
}

function detectFileTypeFromContentType(contentType: string | null) {
    if (!contentType) return undefined;

    const contentTypeToExtension = [
        {
            keyword: "application/parquet" as const,
            extension: "parquet" as const
        },
        {
            keyword: "application/x-parquet" as const,
            extension: "parquet" as const
        },
        { keyword: "text/csv" as const, extension: "csv" as const },
        {
            keyword: "application/csv" as const,
            extension: "csv" as const
        },
        {
            keyword: "application/json" as const,
            extension: "json" as const
        },
        { keyword: "text/json" as const, extension: "json" as const }
    ];

    const match = contentTypeToExtension.find(({ keyword }) => contentType === keyword);
    return match ? match.extension : undefined;
}

async function detectFileTypeFromBytes(response: Response) {
    const fileSignatures = [
        {
            condition: (bytes: Uint8Array) =>
                bytes[0] === 80 && bytes[1] === 65 && bytes[2] === 82 && bytes[3] === 49, // "PAR1"
            extension: "parquet" as const
        },
        {
            condition: (bytes: Uint8Array) => [91, 123].includes(bytes[0]), // "[" or "{"
            extension: "json" as const // JSON
        },
        {
            condition: (bytes: Uint8Array) => {
                const fileContent = new TextDecoder().decode(bytes);
                return (
                    fileContent.includes(",") ||
                    fileContent.includes("|") ||
                    fileContent.includes(";") ||
                    fileContent.includes("\t")
                ); // CSV heuristic
            },
            extension: "csv" as const
        }
    ];

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const match = fileSignatures.find(({ condition }) => condition(bytes));

    return match ? match.extension : undefined;
}

export async function detectFileTypeFromFileDownload(fileDownloadUrl: string) {
    const response = await fetch(fileDownloadUrl, {
        method: "GET",
        headers: { Range: "bytes=0-15" } // Fetch the first 16 bytes
    });

    if (!response.ok) {
        return { fileType: undefined, redirectedUrl: undefined };
    }

    const redirectedUrl = response.url !== fileDownloadUrl ? response.url : undefined;

    if (redirectedUrl) {
        console.log(`The url you provided is being redirected to ${redirectedUrl}`);
    }

    const contentType = response.headers.get("Content-Type");

    const detectedFileTypeFromContentType = detectFileTypeFromContentType(contentType);

    if (detectedFileTypeFromContentType) {
        return { fileType: detectedFileTypeFromContentType, redirectedUrl };
    }

    const detectedFileTypeFromBytes = await detectFileTypeFromBytes(response);

    return { fileType: detectedFileTypeFromBytes, redirectedUrl };
}
