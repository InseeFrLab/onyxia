import { z } from "zod";
import { assert } from "tsafe/assert";
import type { GitProvider, GitRepository } from "core/ports/GitProvider";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";
import {
    fetchProviderApi,
    getIsSameOrigin,
    parseOrThrow,
    BRANCHES_LIMIT,
    fetchBranchNames,
    encodePathSegments
} from "./shared";

const REPOSITORIES_PER_PAGE = 20;
const SEARCH_REPOSITORIES_PER_PAGE = 100;
const SEARCH_PAGES_COUNT = 3;

/** What Onyxia needs: the user and their repositories */
const UI_SCOPES = ["repo"];
/** What git needs in a service (clone, pull, push) */
const GIT_SCOPES = ["repo"];

const zUser = z.object({
    login: z.string(),
    name: z.string().nullable().optional(),
    email: z.string().nullable().optional()
});

const zRepositories = z.array(
    z.object({
        id: z.number(),
        name: z.string(),
        full_name: z.string(),
        description: z.string().nullable(),
        html_url: z.string(),
        clone_url: z.string(),
        default_branch: z.string().nullable().optional()
    })
);

/**
 * github.com → api.github.com, <x>.ghe.com (Enterprise Cloud with data residency) →
 * api.<x>.ghe.com, anything else is an Enterprise Server: <url>/api/v3.
 */
export function getGitHubApiUrl(params: { url: string }): string {
    const { url } = params;

    const { protocol, host } = new URL(url);

    if (host === "github.com") {
        return "https://api.github.com";
    }

    if (host.endsWith(".ghe.com")) {
        return `${protocol}//api.${host}`;
    }

    return `${url}/api/v3`;
}

/**
 * GitHub.
 * - No OAuth in the browser: the token endpoint requires the client secret and doesn't
 *   allow CORS (refused when parsing the configuration).
 * - Service oauth: device flow in the service, Onyxia can't exchange the code. The admin
 *   has to enable "Device Flow" on the OAuth application.
 */
export function createGitHubProvider(params: {
    config: GitProvidersConfig.Provider;
}): GitProvider {
    const { config } = params;
    const { url, authentication } = config;

    assert(config.type === "github");
    assert(
        authentication.ui.type === "personal-access-token",
        "GitHub can only be accessed with a personal access token"
    );
    assert(
        authentication.service.type !== "scoped-access-token",
        "GitHub can't create access tokens for the services"
    );

    const apiUrl = getGitHubApiUrl({ url });
    const authorizationUrl = `${url}/login/oauth/authorize`;
    const tokenUrl = `${url}/login/oauth/access_token`;
    const deviceAuthorizationUrl = `${url}/login/device/code`;
    const tokenCreationUrl = (() => {
        // NOTE: The PAT is also the service's with personal-access-token.
        const scopes =
            authentication.service.type === "personal-access-token"
                ? [...new Set([...UI_SCOPES, ...GIT_SCOPES])]
                : UI_SCOPES;

        const creationUrl = new URL(`${url}/settings/tokens/new`);
        creationUrl.search = new URLSearchParams({
            description: "Onyxia",
            scopes: scopes.join(",")
        }).toString();
        return creationUrl.href;
    })();

    const userConnection: GitProvider["userConnection"] = {
        method: "personal-access-token",
        tokenCreationUrl,
        getTokenExpirationTime: undefined
    };

    const serviceCredentials: GitProvider["serviceCredentials"] = (() => {
        switch (authentication.service.type) {
            case "personal-access-token":
                return { method: "user-token" };
            case "oauth":
                return {
                    method: "oauth",
                    helperConfig: {
                        clientId: authentication.service.clientId,
                        scopes: GIT_SCOPES,
                        authorizationUrl,
                        tokenUrl,
                        deviceAuthorizationUrl
                    },
                    authorizeAtLaunch: undefined
                };
        }
    })();

    return {
        userConnection,
        getUser: async ({ accessToken }) => {
            const response = await fetchProviderApi({
                url: `${apiUrl}/user`,
                accessToken
            });

            if (!response.ok) {
                throw new Error(
                    `GitHub user request failed with status ${response.status}`
                );
            }

            const user = parseOrThrow(zUser, await response.json(), "GitHub user");

            return {
                username: user.login,
                name: user.name || user.login,
                email: user.email || undefined
            };
        },
        listRepositories: async ({ accessToken, search, page, signal }) => {
            const search_lowerCase = search.trim().toLowerCase();

            const isSearching = search_lowerCase !== "";

            const fetchPage = async (gitHubPage: number) => {
                const listUrl = new URL(`${apiUrl}/user/repos`);
                listUrl.search = new URLSearchParams({
                    affiliation: "owner,collaborator,organization_member",
                    sort: "pushed",
                    direction: "desc",
                    page: `${gitHubPage}`,
                    per_page: `${isSearching ? SEARCH_REPOSITORIES_PER_PAGE : REPOSITORIES_PER_PAGE}`
                }).toString();

                const response = await fetchProviderApi({
                    url: listUrl.href,
                    accessToken,
                    signal
                });

                if (!response.ok) {
                    throw new Error(
                        `GitHub repositories request failed with status ${response.status}`
                    );
                }

                return {
                    repositories: parseOrThrow(
                        zRepositories,
                        await response.json(),
                        "GitHub repositories"
                    ),
                    hasNextPage: /rel="next"/.test(response.headers.get("link") ?? "")
                };
            };

            // NOTE: /user/repos has no search parameter (and /search/repositories
            // doesn't restrict to the user's repositories): when searching, several pages
            // are read and filtered here, a page of results being SEARCH_PAGES_COUNT of
            // them. So a page can hold fewer results than REPOSITORIES_PER_PAGE.
            // The first one tells if there is more, the others are read in parallel.
            const firstGitHubPage = isSearching
                ? (page - 1) * SEARCH_PAGES_COUNT + 1
                : page;

            const firstPage = await fetchPage(firstGitHubPage);

            const otherPages =
                isSearching && firstPage.hasNextPage
                    ? await Promise.all(
                          Array.from({ length: SEARCH_PAGES_COUNT - 1 }, (_, index) =>
                              fetchPage(firstGitHubPage + 1 + index)
                          )
                      )
                    : [];

            const pages = [firstPage, ...otherPages];

            const repositories = pages.flatMap(({ repositories }) => repositories);
            const { hasNextPage } = pages[pages.length - 1];

            return {
                repositories: repositories
                    .filter(repository => getIsSameOrigin(repository.clone_url, url))
                    .filter(repository =>
                        repository.full_name.toLowerCase().includes(search_lowerCase)
                    )
                    .map(
                        (repository): GitRepository => ({
                            id: `${repository.id}`,
                            name: repository.name,
                            fullPath: repository.full_name,
                            description: repository.description || undefined,
                            webUrl: repository.html_url,
                            httpCloneUrl: repository.clone_url,
                            defaultBranch: repository.default_branch || undefined
                        })
                    ),
                hasNextPage
            };
        },
        listBranches: ({ accessToken, repositoryFullPath, search, signal }) => {
            // NOTE: No search parameter, filtered on the first page.
            const listUrl = new URL(
                `${apiUrl}/repos/${encodePathSegments(repositoryFullPath)}/branches`
            );
            listUrl.search = new URLSearchParams({
                per_page: `${BRANCHES_LIMIT}`
            }).toString();

            return fetchBranchNames({
                url: listUrl.href,
                accessToken,
                search,
                signal,
                providerName: "GitHub"
            });
        },
        getGitUsername: ({ user }) => user.username,
        serviceCredentials
    };
}
