/**
 * "group/project" of a repository's clone url, relative to its forge's url (which can
 * have a path, a GitLab under /gitlab). undefined: not a repository of this forge.
 */
export function getRepositoryFullPath(params: {
    forgeUrl: string;
    repositoryUrl: string;
}): string | undefined {
    const forgeUrl = canonicalizeUrl(params.forgeUrl);
    const repositoryUrl = canonicalizeUrl(params.repositoryUrl.trim());

    const prefix = `${forgeUrl.replace(/\/+$/, "")}/`;

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

    try {
        return decodeURIComponent(fullPath);
    } catch {
        // NOTE: A malformed escape (%repo): not a repository url.
        return undefined;
    }
}

/**
 * What the launcher writes as a repository: a host and a path, never credentials in it
 * (the helm values end up in saved configurations and shared launch urls).
 */
export function getIsRepositoryUrl(url: string): boolean {
    if (!/^https?:\/\/[^/\s]+\/\S+/.test(url)) {
        return false;
    }

    try {
        // NOTE: Throws on what the regex lets through, a bogus port for instance.
        new URL(url);
    } catch {
        return false;
    }

    return !getHasUrlCredentials(url);
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
 * The forge a repository url belongs to, among the given ones (the connected ones).
 * Several forges on the same url (ui oauth and PAT, say): the first. undefined: none.
 */
export function getForgeIdOfRepositoryUrl(params: {
    forges: { forgeId: string; url: string }[];
    url: string;
}): string | undefined {
    const { url } = params;

    // NOTE: The longest url first, a forge can be hosted below another one
    // (https://git.example.com/gitlab). sort is stable: the first among equal ones.
    return params.forges
        .filter(
            forge =>
                getRepositoryFullPath({
                    forgeUrl: forge.url,
                    repositoryUrl: url
                }) !== undefined
        )
        .sort((a, b) => b.url.length - a.url.length)[0]?.forgeId;
}

/** Lowercase host, no default port: https://GitLab.Example:443 is https://gitlab.example */
function canonicalizeUrl(url: string): string {
    try {
        return new URL(url).href;
    } catch {
        return url;
    }
}
