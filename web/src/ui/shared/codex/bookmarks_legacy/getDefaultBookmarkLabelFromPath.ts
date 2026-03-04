export function getDefaultBookmarkLabelFromPath(path: string): string {
    if (path === "s3://") {
        return "S3 root";
    }

    const withoutScheme = path.replace(/^s3:\/\//, "");
    const trimmed = withoutScheme.replace(/\/$/, "");
    const parts = trimmed.split("/").filter(Boolean);

    if (parts.length === 0) {
        return "S3 root";
    }

    if (parts.length === 1) {
        return parts[0];
    }

    const [, ...rest] = parts;

    if (rest.length === 0) {
        return parts[0];
    }

    const tail = rest.slice(-3);
    return tail.join("-");
}
