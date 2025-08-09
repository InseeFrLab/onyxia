import { type SupportedFileType, getIsSupportedFileType } from "./SupportedFileType";

function inferFileType_fromExtension(sourceUrl: string): SupportedFileType | undefined {
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

    if (!getIsSupportedFileType(extension)) {
        return undefined;
    }

    return extension;
}

function inferFileType_fromContentType(contentType: string) {
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

async function inferFileType_fromBytes(firstBytes: ArrayBuffer) {
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

    const firstBytes_uint8Array = new Uint8Array(firstBytes);

    const match = fileSignatures.find(({ condition }) =>
        condition(firstBytes_uint8Array)
    );

    return match ? match.extension : undefined;
}

export async function inferFileType(params: {
    sourceUrl: string;
    getContentType: () => Promise<string | undefined>;
    getFirstBytes: () => Promise<ArrayBuffer>;
}): Promise<SupportedFileType | undefined> {
    const { sourceUrl, getContentType, getFirstBytes } = params;

    file_extension: {
        const fileType = inferFileType_fromExtension(sourceUrl);

        if (fileType === undefined) {
            break file_extension;
        }

        return fileType;
    }

    content_type: {
        const contentType = await getContentType();

        if (contentType === undefined) {
            break content_type;
        }

        const fileType = inferFileType_fromContentType(contentType);

        if (fileType === undefined) {
            break content_type;
        }

        return fileType;
    }

    from_bytes: {
        const firstBytes = await getFirstBytes();

        const fileType = await inferFileType_fromBytes(firstBytes);

        if (fileType === undefined) {
            break from_bytes;
        }

        return fileType;
    }

    return undefined;
}
