import { z } from "zod";
import { assert } from "tsafe/assert";
import type { GitProvider, GitRepository } from "core/ports/GitProvider";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";
import {
    createServiceAuthorization,
    createUiOAuth,
    fetchProviderApi,
    getIsSameOrigin,
    parseOrThrow,
    BRANCHES_LIMIT,
    fetchBranchNames
} from "./shared";

const REPOSITORIES_PER_PAGE = 20;

/** What Onyxia needs: the user and their repositories */
const UI_SCOPES = ["read_api"];
/** What git needs in a service (clone, pull, push) */
const GIT_SCOPES = ["read_repository", "write_repository"];
/** Creating a token is a write: instead of UI_SCOPES for scoped-access-token */
const TOKEN_CREATION_SCOPES = ["api"];

const zUser = z.object({
    username: z.string(),
    name: z.string(),
    email: z.string().nullable().optional(),
    public_email: z.string().nullable().optional()
});

const zRepositories = z.array(
    z.object({
        id: z.number(),
        name: z.string(),
        path_with_namespace: z.string(),
        description: z.string().nullable(),
        web_url: z.string(),
        http_url_to_repo: z.string(),
        default_branch: z.string().nullable().optional()
    })
);

const zPersonalAccessToken = z.object({ token: z.string().min(1) });

/**
 * GitLab (gitlab.com and self-managed).
 * - scoped-access-token: fine-grained personal access tokens, GitLab >= 19.2.
 */
export function createGitLabProvider(params: {
    config: GitProvidersConfig.Provider;
}): GitProvider {
    const { config } = params;
    const { url, authentication } = config;

    assert(config.type === "gitlab");

    const uiScopes =
        authentication.service.type === "scoped-access-token"
            ? TOKEN_CREATION_SCOPES
            : UI_SCOPES;

    const apiUrl = `${url}/api/v4`;
    const authorizationUrl = `${url}/oauth/authorize`;
    const tokenUrl = `${url}/oauth/token`;
    const deviceAuthorizationUrl = `${url}/oauth/authorize_device`;
    const revocationUrl = `${url}/oauth/revoke`;
    const authorizedApplicationsUrl = `${url}/-/user_settings/applications`;
    const tokenCreationUrl = (() => {
        // NOTE: The PAT is also the service's with personal-access-token.
        const scopes =
            authentication.service.type === "personal-access-token"
                ? [...new Set([...uiScopes, ...GIT_SCOPES])]
                : uiScopes;

        const creationUrl = new URL(`${url}/-/user_settings/personal_access_tokens`);
        creationUrl.search = new URLSearchParams({
            name: "Onyxia",
            scopes: scopes.join(",")
        }).toString();
        return creationUrl.href;
    })();

    const userConnection: GitProvider["userConnection"] = (() => {
        switch (authentication.ui.type) {
            case "oauth":
                return {
                    method: "oauth",
                    ...createUiOAuth({
                        authorizationUrl,
                        tokenUrl,
                        clientId: authentication.ui.clientId,
                        scopes: uiScopes,
                        revokeTokens: async ({ refreshToken }) => {
                            assert(authentication.ui.type === "oauth");

                            const response = await fetch(revocationUrl, {
                                method: "POST",
                                credentials: "omit",
                                cache: "no-store",
                                referrerPolicy: "no-referrer",
                                body: new URLSearchParams({
                                    client_id: authentication.ui.clientId,
                                    token: refreshToken,
                                    token_type_hint: "refresh_token"
                                })
                            });

                            if (!response.ok) {
                                throw new Error(
                                    `GitLab token revocation failed with status ${response.status}`
                                );
                            }
                        },
                        authorizedApplicationsUrl
                    })
                };
            case "personal-access-token":
                return { method: "personal-access-token", tokenCreationUrl };
        }
    })();

    const serviceCredentials: GitProvider["serviceCredentials"] = (() => {
        switch (authentication.service.type) {
            case "personal-access-token":
                return { method: "user-token" };
            case "scoped-access-token":
                return {
                    method: "scoped-token",
                    // NOTE: Fine-grained personal access token, GitLab >= 19.2.
                    // https://docs.gitlab.com/api/user_tokens/#create-a-personal-access-token
                    createToken: async ({ accessToken, name, expirationTime }) => {
                        const permissions = ["download_code", "push_code"];

                        const response = await fetchProviderApi({
                            url: `${apiUrl}/user/personal_access_tokens`,
                            method: "POST",
                            accessToken,
                            jsonBody: {
                                name,
                                expires_at: new Date(expirationTime)
                                    .toISOString()
                                    .slice(0, 10),
                                granular_scopes: [
                                    { access: "personal_projects", permissions },
                                    { access: "all_memberships", permissions }
                                ]
                            }
                        });

                        if (response.status === 400 || response.status === 404) {
                            throw new Error(
                                `GitLab refused to create an access token (${response.status}): GitLab >= 19.2 with fine-grained tokens enabled is required`
                            );
                        }

                        if (response.status === 403) {
                            throw new Error(
                                "GitLab refused to create an access token (403): the token used to create it needs the api scope"
                            );
                        }

                        if (!response.ok) {
                            throw new Error(
                                `GitLab access token creation failed with status ${response.status}`
                            );
                        }

                        const { token } = parseOrThrow(
                            zPersonalAccessToken,
                            await response.json(),
                            "GitLab personal access token"
                        );

                        return { token };
                    }
                };
            case "oauth": {
                const { clientId } = authentication.service;

                return {
                    method: "oauth",
                    helperConfig: {
                        clientId,
                        scopes: GIT_SCOPES,
                        authorizationUrl,
                        tokenUrl,
                        deviceAuthorizationUrl
                    },
                    authorizeAtLaunch: createServiceAuthorization({
                        authorizationUrl,
                        tokenUrl,
                        clientId,
                        scopes: GIT_SCOPES
                    })
                };
            }
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
                    `GitLab user request failed with status ${response.status}`
                );
            }

            const user = parseOrThrow(zUser, await response.json(), "GitLab user");

            return {
                username: user.username,
                name: user.name,
                email: user.public_email || user.email || undefined
            };
        },
        listRepositories: async ({ accessToken, search, page, signal }) => {
            const listUrl = new URL(`${apiUrl}/projects`);
            listUrl.search = new URLSearchParams({
                membership: "true",
                simple: "true",
                order_by: "last_activity_at",
                sort: "desc",
                search,
                search_namespaces: "true",
                page: `${page}`,
                per_page: `${REPOSITORIES_PER_PAGE}`
            }).toString();

            const response = await fetchProviderApi({
                url: listUrl.href,
                accessToken,
                signal
            });

            if (!response.ok) {
                throw new Error(
                    `GitLab projects request failed with status ${response.status}`
                );
            }

            const projects = parseOrThrow(
                zRepositories,
                await response.json(),
                "GitLab projects"
            );

            const nextPage = response.headers.get("x-next-page");

            return {
                repositories: projects
                    .filter(project => getIsSameOrigin(project.http_url_to_repo, url))
                    .map(
                        (project): GitRepository => ({
                            id: `${project.id}`,
                            name: project.name,
                            fullPath: project.path_with_namespace,
                            description: project.description || undefined,
                            webUrl: project.web_url,
                            httpCloneUrl: project.http_url_to_repo,
                            defaultBranch: project.default_branch ?? undefined
                        })
                    ),
                hasNextPage:
                    nextPage === null
                        ? projects.length === REPOSITORIES_PER_PAGE
                        : nextPage !== ""
            };
        },
        // NOTE: Any non blank username is accepted with a personal access token.
        listBranches: ({ accessToken, repositoryFullPath, search, signal }) => {
            const listUrl = new URL(
                `${apiUrl}/projects/${encodeURIComponent(repositoryFullPath)}/repository/branches`
            );
            listUrl.search = new URLSearchParams({
                per_page: `${BRANCHES_LIMIT}`,
                search: search.trim()
            }).toString();

            return fetchBranchNames({
                url: listUrl.href,
                accessToken,
                search,
                signal,
                providerName: "GitLab"
            });
        },
        getGitUsername: ({ user }) => user.username,
        serviceCredentials
    };
}
