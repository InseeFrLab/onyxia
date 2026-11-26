/**
 * "group/project" of a repository's clone url, relative to its provider's url (which can
 * have a path, a GitLab under /gitlab). undefined: not a repository of this provider.
 */
export function getRepositoryFullPath(params: {
    providerUrl: string;
    repositoryUrl: string;
}): string | undefined {
    const providerUrl = canonicalizeUrl(params.providerUrl);
    const repositoryUrl = canonicalizeUrl(params.repositoryUrl.trim());

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

/**
 * What the launcher writes as a repository: a host and a path, never credentials in it
 * (the helm values end up in saved configurations and shared launch urls).
 */
export function getIsRepositoryUrl(url: string): boolean {
    return /^https?:\/\/[^/\s]+\/\S+/.test(url) && !getHasUrlCredentials(url);
}

/** user:token@host */
export function getHasUrlCredentials(url: string): boolean {
    try {
        const { username, password } = new URL(url);
        return username !== "" || password !== "";
    } catch {
        return false;
    }
}

/** group/project of a clone url, the url itself when it doesn't look like one */
export function getRepositoryPath(url: string): string {
    try {
        const path = new URL(url).pathname.replace(/^\/+/, "").replace(/\.git$/, "");

        return path === "" ? url : path;
    } catch {
        return url;
    }
}

/** The host of a clone url, the url itself when it doesn't look like one */
export function getRepositoryHost(url: string): string {
    try {
        return new URL(url).host;
    } catch {
        return url;
    }
}

/**
 * The provider a repository url belongs to, among the given ones (the connected ones).
 * Several providers on the same url (ui oauth and PAT, say): the first. undefined: none.
 */
export function getProviderIdOfRepositoryUrl(params: {
    providers: { providerId: string; url: string }[];
    url: string;
}): string | undefined {
    const { url } = params;

    return params.providers.find(
        provider =>
            getRepositoryFullPath({ providerUrl: provider.url, repositoryUrl: url }) !==
            undefined
    )?.providerId;
}

/** Lowercase host, no default port: https://GitLab.Example:443 is https://gitlab.example */
function canonicalizeUrl(url: string): string {
    try {
        return new URL(url).href;
    } catch {
        return url;
    }
}
