export function triggerBrowserDownload(params: {
    url: string;
    fileBasename: string | undefined;
}): void {
    const { url, fileBasename = getFileBasenameFromUrl(url) } = params;

    const a = document.createElement("a");
    a.href = url;
    a.download = fileBasename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
}

export function getFileBasenameFromUrl(url: string): string {
    const { pathname } = new URL(url, window.location.href);
    const pathSegments = pathname.split("/").filter(pathSegment => pathSegment !== "");
    const lastPathSegment = pathSegments[pathSegments.length - 1];

    if (lastPathSegment === undefined) {
        return "download";
    }

    try {
        return decodeURIComponent(lastPathSegment);
    } catch {
        return lastPathSegment;
    }
}
