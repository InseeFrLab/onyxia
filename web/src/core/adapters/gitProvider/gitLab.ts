import { z } from "zod";
import { assert } from "tsafe/assert";
import type { GitProvider, GitRepository } from "core/ports/GitProvider";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";
import {
    createServiceAuthorization,
    createUiOAuth,
    fetchProviderApi,
    getIsSameOrigin,
    parseOrThrow
} from "./shared";

const REPOSITORIES_PER_PAGE = 20;

/** What git needs in a service (clone, pull, push) */
const GIT_SCOPES = ["read_repository", "write_repository"];

const zUser = z.object({
    username: z.string(),
    name: z.string(),
    email: z.string().nullable().optional(),
    public_email: z.string().nullable().optional()
});

const zProjects = z.array(
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

const zProject = z.object({ id: z.number() });

const zPersonalAccessToken = z.object({
    id: z.number(),
    token: z.string().min(1),
    expires_at: z.string().nullable()
});

export function createGitLabProvider(params: {
    config: GitProvidersConfig.Provider;
}): GitProvider {
    const { config } = params;
    const { id, url, displayName, authentication } = config;

    assert(config.type === "gitlab");

    const authorizationUrl = `${url}/oauth/authorize`;
    const tokenUrl = `${url}/oauth/token`;

    /**
     * NOTE: Creating a token is a write: "api" is needed for scoped-access-token,
     * "read_api" is enough otherwise.
     */
    const uiScopes =
        authentication.service.type === "scoped-access-token" ? ["api"] : ["read_api"];

    const getProjectId = async (params: {
        accessToken: string;
        repositoryUrl: string;
    }): Promise<number> => {
        const { accessToken, repositoryUrl } = params;

        const projectPath = new URL(repositoryUrl).pathname
            .replace(/^\//, "")
            .replace(/\.git$/, "");

        const response = await fetchProviderApi({
            url: `${url}/api/v4/projects/${encodeURIComponent(projectPath)}`,
            accessToken
        });

        if (!response.ok) {
            throw new Error(
                `GitLab project ${projectPath} not found (${response.status})`
            );
        }

        return parseOrThrow(zProject, await response.json(), "GitLab project").id;
    };

    const ui: GitProvider["ui"] = (() => {
        switch (authentication.ui.type) {
            case "oauth":
                return {
                    type: "oauth",
                    oauth: createUiOAuth({
                        authorizationUrl,
                        tokenUrl,
                        clientId: authentication.ui.clientId,
                        scopes: uiScopes,
                        revokeTokens: async ({ refreshToken }) => {
                            assert(authentication.ui.type === "oauth");

                            const response = await fetch(`${url}/oauth/revoke`, {
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
                        authorizedApplicationsUrl: `${url}/-/user_settings/applications`
                    })
                };
            case "personal-access-token": {
                const scopes = (() => {
                    switch (authentication.service.type) {
                        case "scoped-access-token":
                            return ["api"];
                        case "personal-access-token":
                            return ["read_api", ...GIT_SCOPES];
                        case "oauth":
                            return ["read_api"];
                    }
                })();

                const creationUrl = new URL(
                    `${url}/-/user_settings/personal_access_tokens`
                );
                creationUrl.search = new URLSearchParams({
                    name: "Onyxia",
                    scopes: scopes.join(",")
                }).toString();

                return {
                    type: "personal-access-token",
                    personalAccessTokenCreationUrl: creationUrl.href
                };
            }
        }
    })();

    const service: GitProvider["service"] = (() => {
        switch (authentication.service.type) {
            case "personal-access-token":
                return { type: "personal-access-token" };
            case "scoped-access-token":
                return {
                    type: "scoped-access-token",
                    lifetimeDays: authentication.service.lifetimeDays,
                    // NOTE: Fine-grained personal access token, GitLab >= 19.2.
                    // https://docs.gitlab.com/api/user_tokens/#create-a-personal-access-token
                    createAccessToken: async ({
                        accessToken,
                        name,
                        repositories,
                        permission,
                        expirationTime
                    }) => {
                        const permissions =
                            permission === "read"
                                ? ["download_code"]
                                : ["download_code", "push_code"];

                        const granular_scopes =
                            repositories === "all"
                                ? [
                                      { access: "personal_projects", permissions },
                                      { access: "all_memberships", permissions }
                                  ]
                                : [
                                      {
                                          access: "selected_memberships",
                                          permissions,
                                          project_ids: await Promise.all(
                                              repositories.urls.map(repositoryUrl =>
                                                  getProjectId({
                                                      accessToken,
                                                      repositoryUrl
                                                  })
                                              )
                                          )
                                      }
                                  ];

                        const response = await fetchProviderApi({
                            url: `${url}/api/v4/user/personal_access_tokens`,
                            method: "POST",
                            accessToken,
                            jsonBody: {
                                name,
                                expires_at: new Date(expirationTime)
                                    .toISOString()
                                    .slice(0, 10),
                                granular_scopes
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

                        const token = parseOrThrow(
                            zPersonalAccessToken,
                            await response.json(),
                            "GitLab personal access token"
                        );

                        return {
                            id: `${token.id}`,
                            token: token.token,
                            // NOTE: Any non blank username is accepted with a personal access token.
                            gitUsername: "oauth2",
                            expirationTime:
                                token.expires_at === null
                                    ? expirationTime
                                    : new Date(token.expires_at).getTime()
                        };
                    }
                };
            case "oauth": {
                const { clientId } = authentication.service;

                return {
                    type: "oauth",
                    helperConfig: {
                        clientId,
                        scopes: GIT_SCOPES,
                        authorizationUrl,
                        tokenUrl,
                        deviceAuthorizationUrl: `${url}/oauth/authorize_device`
                    },
                    authorization: createServiceAuthorization({
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
        id,
        displayName,
        url,
        ui,
        service,
        getUser: async ({ accessToken }) => {
            const response = await fetchProviderApi({
                url: `${url}/api/v4/user`,
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
            const apiUrl = new URL(`${url}/api/v4/projects`);
            apiUrl.search = new URLSearchParams({
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
                url: apiUrl.href,
                accessToken,
                signal
            });

            if (!response.ok) {
                throw new Error(
                    `GitLab projects request failed with status ${response.status}`
                );
            }

            const projects = parseOrThrow(
                zProjects,
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
        }
    };
}
