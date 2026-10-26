import {
    USER_PROVIDER_ID_PREFIX,
    type GitProvidersConfig
} from "core/ports/OnyxiaApi/GitProvidersConfig";

/**
 * A provider the user added in Account > Git (gitlab.com, github.com, their own Forgejo...).
 * Always a personal access token, for Onyxia and for the services: an OAuth application
 * would have to be registered with Onyxia's redirect URI.
 */
export type UserProvider = {
    /** USER_PROVIDER_ID_PREFIX followed by the url without its scheme */
    id: string;
    type: GitProvidersConfig.ProviderType;
    /** Without trailing slash */
    url: string;
    displayName: string;
};

export type UserProviderCreationError = "invalid url" | "already configured";

/**
 * Normalizes what the user typed. A provider whose url is already configured, by the
 * admin or by the user, is refused: the services configure git per url, one set of
 * credentials each. The connection itself is checked by the caller.
 */
export function createUserProvider(params: {
    type: GitProvidersConfig.ProviderType;
    url: string;
    /** Empty: the host of the url */
    displayName: string;
    gitProvidersConfig: GitProvidersConfig;
    userProviders: UserProvider[];
}):
    | { isSuccess: true; userProvider: UserProvider }
    | { isSuccess: false; error: UserProviderCreationError } {
    const { type, gitProvidersConfig, userProviders } = params;

    const url = normalizeUserProviderUrl(params.url);

    if (url === undefined) {
        return { isSuccess: false, error: "invalid url" };
    }

    if (
        [...gitProvidersConfig.providers, ...userProviders].some(
            provider => normalizeUserProviderUrl(provider.url) === url
        )
    ) {
        return { isSuccess: false, error: "already configured" };
    }

    const displayName = params.displayName.trim();

    return {
        isSuccess: true,
        userProvider: {
            id: `${USER_PROVIDER_ID_PREFIX}${url.replace(/^https?:\/\//, "")}`,
            type,
            url,
            displayName: displayName === "" ? new URL(url).host : displayName
        }
    };
}

export function getUserProviderConfig(params: {
    userProvider: UserProvider;
}): GitProvidersConfig.Provider {
    const { userProvider } = params;

    return {
        ...userProvider,
        logoUrl: undefined,
        documentation: undefined,
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
export function normalizeUserProviderUrl(url: string): string | undefined {
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
        (!parsedUrl.hostname.includes(".") && parsedUrl.hostname !== "localhost")
    ) {
        return undefined;
    }

    return `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`.replace(
        /\/+$/,
        ""
    );
}
