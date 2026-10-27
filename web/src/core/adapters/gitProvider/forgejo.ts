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

// TODO(phase 1): Check that these scopes are enforced, older versions ignore them and
// issue tokens with every right (minimal version to document).
const UI_SCOPES = ["read:user", "read:repository"];
const GIT_SCOPES = ["write:repository"];

const zUser = z.object({
    login: z.string(),
    full_name: z.string().optional(),
    email: z.string().optional()
});

const zRepositories = z.object({
    data: z.array(
        z.object({
            id: z.number(),
            name: z.string(),
            full_name: z.string(),
            description: z.string().optional(),
            html_url: z.string(),
            clone_url: z.string(),
            default_branch: z.string().optional()
        })
    )
});

/**
 * Forgejo (and Gitea).
 * - CORS is disabled by default, the instance needs `[cors] ENABLED = true`.
 * - No device flow.
 * - Access tokens can only be created with the user's password, so no
 *   scoped-access-token (refused when parsing the configuration).
 * - No revocation endpoint: the user revokes the grant in their settings.
 */
export function createForgejoProvider(params: {
    config: GitProvidersConfig.Provider;
}): GitProvider {
    const { config } = params;
    const { url, authentication } = config;

    assert(config.type === "forgejo");

    const authorizationUrl = `${url}/login/oauth/authorize`;
    const tokenUrl = `${url}/login/oauth/access_token`;
    const applicationsUrl = `${url}/user/settings/applications`;

    const userConnection: GitProvider["userConnection"] = (() => {
        switch (authentication.ui.type) {
            case "oauth":
                return {
                    method: "oauth",
                    ...createUiOAuth({
                        authorizationUrl,
                        tokenUrl,
                        clientId: authentication.ui.clientId,
                        scopes: UI_SCOPES,
                        revokeTokens: undefined,
                        authorizedApplicationsUrl: applicationsUrl
                    })
                };
            case "personal-access-token":
                // NOTE: The token creation form can't be prefilled.
                return {
                    method: "personal-access-token",
                    tokenCreationUrl: applicationsUrl
                };
        }
    })();

    const serviceCredentials: GitProvider["serviceCredentials"] = (() => {
        switch (authentication.service.type) {
            case "personal-access-token":
                return { method: "user-token" };
            case "scoped-access-token":
                assert(false, "Forgejo can't create access tokens for the services");
            // eslint-disable-next-line no-fallthrough
            case "oauth": {
                const { clientId } = authentication.service;

                return {
                    method: "oauth",
                    helperConfig: {
                        clientId,
                        scopes: GIT_SCOPES,
                        authorizationUrl,
                        tokenUrl,
                        deviceAuthorizationUrl: undefined
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
        serviceCredentials,
        getGitUsername: ({ user }) => user.username,
        getUser: async ({ accessToken }) => {
            const response = await fetchProviderApi({
                url: `${url}/api/v1/user`,
                accessToken
            });

            if (!response.ok) {
                throw new Error(
                    `Forgejo user request failed with status ${response.status}`
                );
            }

            const user = parseOrThrow(zUser, await response.json(), "Forgejo user");

            return {
                username: user.login,
                name: user.full_name || user.login,
                email: user.email || undefined
            };
        },
        listRepositories: async ({ accessToken, search, page, signal }) => {
            // NOTE: Repositories visible to the user (their own, their organizations',
            // and the public ones), most recently updated first.
            const apiUrl = new URL(`${url}/api/v1/repos/search`);
            apiUrl.search = new URLSearchParams({
                q: search,
                sort: "updated",
                order: "desc",
                page: `${page}`,
                limit: `${REPOSITORIES_PER_PAGE}`
            }).toString();

            const response = await fetchProviderApi({
                url: apiUrl.href,
                accessToken,
                signal
            });

            if (!response.ok) {
                throw new Error(
                    `Forgejo repositories request failed with status ${response.status}`
                );
            }

            const { data } = parseOrThrow(
                zRepositories,
                await response.json(),
                "Forgejo repositories"
            );

            const totalCount = Number(response.headers.get("x-total-count"));

            return {
                repositories: data
                    .filter(repository => getIsSameOrigin(repository.clone_url, url))
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
                hasNextPage:
                    Number.isFinite(totalCount) && totalCount > 0
                        ? page * REPOSITORIES_PER_PAGE < totalCount
                        : data.length === REPOSITORIES_PER_PAGE
            };
        }
    };
}
