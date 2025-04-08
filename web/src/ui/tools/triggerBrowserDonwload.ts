export function triggerBrowserDownload(params: { url: string; filename: string }) {
    const { url, filename } = params;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
}
