/** S3 keys are literal strings: do not URL-decode or collapse empty segments. */
export function normalizeDirectory(value: string, delimiter: string): string | undefined {
    const match = value.match(/^s3:\/\/([^/\s]+)(?:\/([\s\S]*))?$/);
    if (match === null || delimiter === "") {
        return undefined;
    }
    const root = `s3://${match[1]}/`;
    const key = match[2] ?? "";
    return root + (key === "" || key.endsWith(delimiter) ? key : key + delimiter);
}

export function directoryBreadcrumbs(
    directory: string,
    delimiter: string
): { label: string; uri: string }[] {
    const slash = directory.indexOf("/", "s3://".length);
    const root = directory.slice(0, slash + 1);
    const segments = directory.slice(root.length).split(delimiter).slice(0, -1);
    return [
        { label: root.slice("s3://".length, -1), uri: root },
        ...segments.map((label, i) => ({
            label,
            uri: root + segments.slice(0, i + 1).join(delimiter) + delimiter
        }))
    ];
}

export function isForbiddenDestination(params: {
    directory: string;
    delimiter: string;
    sources: { uri: string; isDirectory: boolean }[];
}): boolean {
    const { directory, delimiter, sources } = params;
    return sources.some(source => {
        const root = source.uri.indexOf("/", "s3://".length);
        const segments = source.uri.slice(root + 1).split(delimiter);
        if (source.isDirectory) {
            segments.pop();
        }
        const basename = segments.at(-1);
        return (
            (source.isDirectory && directory.startsWith(source.uri)) ||
            directory + basename + (source.isDirectory ? delimiter : "") === source.uri
        );
    });
}
