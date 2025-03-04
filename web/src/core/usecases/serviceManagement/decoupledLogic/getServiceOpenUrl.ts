export type HelmReleaseLike = {
    urls: string[];
    postInstallInstructions: string | undefined;
};

export function getServiceOpenUrl(params: { helmRelease: HelmReleaseLike }): string {
    const {
        helmRelease: { urls, postInstallInstructions }
    } = params;

    const defaultUrl = [...urls].sort((a, b) => a.localeCompare(b))[0];

    if (!postInstallInstructions) {
        return defaultUrl;
    }

    const urlRegex = new RegExp(
        urls
            .map(
                url =>
                    url
                        .replace(/\/$/, "") // Remove trailing slash
                        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?:[/?#][^\\s]*|\\b)" // Ensure correct path/query matching
            )
            .join("|"),
        "g"
    );

    const match = urlRegex.exec(postInstallInstructions);

    return match ? match[0] : defaultUrl;
}
