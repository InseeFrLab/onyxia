export function getUrlProtocol(url: string): "http" | "s3" | undefined {
    if (/^https?:\/\//.test(url)) {
        return "http" as const;
    }

    if (url.startsWith("s3://")) {
        return "s3" as const;
    }

    return undefined;
}
