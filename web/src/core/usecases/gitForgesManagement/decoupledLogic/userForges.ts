import {
    getUserForgeId,
    getIsBitbucketCloudUrl,
    type GitForgesConfig
} from "core/ports/OnyxiaApi/GitForgesConfig";

/**
 * A forge the user added in Account > Git (gitlab.com, github.com, their own Forgejo...).
 * Always a personal access token, for Onyxia and for the services: an OAuth application
 * would have to be registered with Onyxia's redirect URI.
 */
export type UserForge = {
    /** See getUserForgeId */
    id: string;
    type: GitForgesConfig.ForgeType;
    /** Without trailing slash */
    url: string;
    displayName: string;
};

export type UserForgeCreationError = "invalid url" | "already configured";

/**
 * Normalizes what the user typed. A forge whose url is already configured, by the
 * admin or by the user, is refused: the services configure git per url, one set of
 * credentials each. The connection itself is checked by the caller.
 */
export function createUserForge(params: {
    type: GitForgesConfig.ForgeType;
    url: string;
    /** Empty: the host of the url */
    displayName: string;
    gitForgesConfig: GitForgesConfig;
    userForges: UserForge[];
}):
    | { isSuccess: true; userForge: UserForge }
    | { isSuccess: false; error: UserForgeCreationError } {
    const { type, gitForgesConfig, userForges } = params;

    const url = normalizeUserForgeUrl(params.url);

    // NOTE: Bitbucket Data Center is another API.
    if (url === undefined || (type === "bitbucket" && !getIsBitbucketCloudUrl(url))) {
        return { isSuccess: false, error: "invalid url" };
    }

    const id = getUserForgeId({ url });

    // NOTE: Compared without the scheme, like the id: http and https of a same url
    // would get the same one.
    if (
        [...gitForgesConfig.forges, ...userForges].some(forge => {
            const forgeUrl = normalizeUserForgeUrl(forge.url);

            return forgeUrl !== undefined && getUserForgeId({ url: forgeUrl }) === id;
        })
    ) {
        return { isSuccess: false, error: "already configured" };
    }

    const displayName = params.displayName.trim();

    return {
        isSuccess: true,
        userForge: {
            id,
            type,
            url,
            displayName: displayName === "" ? new URL(url).host : displayName
        }
    };
}

export function getUserForgeConfig(params: {
    userForge: UserForge;
}): GitForgesConfig.Forge {
    const { userForge } = params;

    return {
        ...userForge,
        logoUrl: undefined,
        authentication: {
            ui: { type: "personal-access-token" },
            service: { type: "personal-access-token" }
        }
    };
}

/**
 * Lower case host, no trailing slash, query nor fragment, https when the scheme is
 * omitted. undefined: not an http(s) url.
 */
export function normalizeUserForgeUrl(url: string): string | undefined {
    const url_trimmed = url.trim();

    let parsedUrl: URL;

    try {
        // NOTE: "gitlab.com" is understood as https://gitlab.com
        parsedUrl = new URL(
            /^[a-z][a-z0-9+.-]*:\/\//i.test(url_trimmed)
                ? url_trimmed
                : `https://${url_trimmed}`
        );
    } catch {
        return undefined;
    }

    if (
        (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") ||
        parsedUrl.username !== "" ||
        parsedUrl.password !== "" ||
        parsedUrl.hostname === ""
    ) {
        return undefined;
    }

    return `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`.replace(
        /\/+$/,
        ""
    );
}
