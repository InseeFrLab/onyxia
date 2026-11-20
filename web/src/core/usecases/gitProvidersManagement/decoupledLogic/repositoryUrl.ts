/**
 * "group/project" of a repository's clone url, relative to its provider's url (which can
 * have a path, a GitLab under /gitlab). undefined: not a repository of this provider.
 */
export function getRepositoryFullPath(params: {
    providerUrl: string;
    repositoryUrl: string;
}): string | undefined {
    const { providerUrl } = params;

    const repositoryUrl = params.repositoryUrl.trim();

    const prefix = `${providerUrl.replace(/\/+$/, "")}/`;

    if (!repositoryUrl.startsWith(prefix)) {
        return undefined;
    }

    const fullPath = repositoryUrl
        .slice(prefix.length)
        .replace(/[?#].*$/, "")
        .replace(/\/+$/, "")
        .replace(/\.git$/, "");

    if (fullPath === "" || !fullPath.includes("/")) {
        return undefined;
    }

    return decodeURIComponent(fullPath);
}
