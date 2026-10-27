import { z } from "zod";
import { assert } from "tsafe/assert";
import { exclude } from "tsafe/exclude";
import type { GitProvider, GitRepository } from "core/ports/GitProvider";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";
import { fetchProviderApi, getIsSameOrigin, parseOrThrow } from "./shared";

const API_URL = "https://api.bitbucket.org/2.0";

const REPOSITORIES_PER_PAGE = 20;

/**
 * Paired with an API token for git over HTTPS, it spares the user's Bitbucket username,
 * which is case sensitive there.
 */
const API_TOKEN_GIT_USERNAME = "x-bitbucket-api-token-auth";

const zUser = z.object({
    username: z.string().optional(),
    nickname: z.string().optional(),
    display_name: z.string().optional()
});

const zEmails = z.object({
    values: z.array(
        z.object({
            email: z.string(),
            is_primary: z.boolean(),
            is_confirmed: z.boolean()
        })
    )
});

const zRepositories = z.object({
    values: z.array(
        z.object({
            uuid: z.string(),
            name: z.string(),
            full_name: z.string(),
            description: z.string().nullable().optional(),
            links: z.object({
                html: z.object({ href: z.string() }),
                clone: z.array(z.object({ name: z.string(), href: z.string() }))
            }),
            mainbranch: z.object({ name: z.string() }).nullable().optional()
        })
    ),
    next: z.string().optional()
});

/**
 * Bitbucket Cloud (bitbucket.org), with an API token (scoped, Bearer). Data Center is
 * another API, not supported.
 * - No OAuth: the token endpoint requires the client secret, both for the code and the
 *   refresh token, and PKCE isn't enforced (refused when parsing the configuration).
 * - The token can't be prefilled: it is created on id.atlassian.com, with the scopes
 *   read:user:bitbucket, read:repository:bitbucket and write:repository:bitbucket.
 */
export function createBitbucketProvider(params: {
    config: GitProvidersConfig.Provider;
}): GitProvider {
    const { config } = params;
    const { url, authentication } = config;

    assert(config.type === "bitbucket");
    assert(
        authentication.ui.type === "personal-access-token" &&
            authentication.service.type === "personal-access-token",
        "Bitbucket can only be accessed with an API token"
    );

    return {
        userConnection: {
            method: "personal-access-token",
            tokenCreationUrl:
                "https://id.atlassian.com/manage-profile/security/api-tokens"
        },
        serviceCredentials: { method: "user-token" },
        getGitUsername: () => API_TOKEN_GIT_USERNAME,
        getUser: async ({ accessToken }) => {
            const response = await fetchProviderApi({
                url: `${API_URL}/user`,
                accessToken
            });

            if (!response.ok) {
                throw new Error(
                    `Bitbucket user request failed with status ${response.status}`
                );
            }

            const user = parseOrThrow(zUser, await response.json(), "Bitbucket user");

            const username = user.username ?? user.nickname;

            assert(username !== undefined, "Bitbucket user without username");

            // NOTE: Same scope (read:user:bitbucket). The user is known even if this
            // fails, the Onyxia account's email is used then.
            const email = await (async () => {
                const response = await fetchProviderApi({
                    url: `${API_URL}/user/emails`,
                    accessToken
                });

                if (!response.ok) {
                    return undefined;
                }

                const { values } = parseOrThrow(
                    zEmails,
                    await response.json(),
                    "Bitbucket user emails"
                );

                return values.find(
                    ({ is_primary, is_confirmed }) => is_primary && is_confirmed
                )?.email;
            })();

            return {
                username,
                name: user.display_name || username,
                email
            };
        },
        listRepositories: async ({ accessToken, search, page, signal }) => {
            const listUrl = new URL(`${API_URL}/repositories`);

            const search_trimmed = search.trim();

            listUrl.search = new URLSearchParams({
                role: "member",
                sort: "-updated_on",
                page: `${page}`,
                pagelen: `${REPOSITORIES_PER_PAGE}`,
                ...(search_trimmed === ""
                    ? {}
                    : { q: `full_name ~ ${JSON.stringify(search_trimmed)}` })
            }).toString();

            const response = await fetchProviderApi({
                url: listUrl.href,
                accessToken,
                signal
            });

            if (!response.ok) {
                throw new Error(
                    `Bitbucket repositories request failed with status ${response.status}`
                );
            }

            const { values, next } = parseOrThrow(
                zRepositories,
                await response.json(),
                "Bitbucket repositories"
            );

            return {
                repositories: values
                    .map((repository): GitRepository | undefined => {
                        const cloneUrl = repository.links.clone.find(
                            ({ name }) => name === "https"
                        )?.href;

                        if (cloneUrl === undefined || !getIsSameOrigin(cloneUrl, url)) {
                            return undefined;
                        }

                        // NOTE: Bitbucket puts the username in the clone url.
                        const httpCloneUrl = new URL(cloneUrl);
                        httpCloneUrl.username = "";
                        httpCloneUrl.password = "";

                        return {
                            id: repository.uuid,
                            name: repository.name,
                            fullPath: repository.full_name,
                            description: repository.description || undefined,
                            webUrl: repository.links.html.href,
                            httpCloneUrl: httpCloneUrl.href,
                            defaultBranch: repository.mainbranch?.name
                        };
                    })
                    .filter(exclude(undefined)),
                hasNextPage: next !== undefined
            };
        }
    };
}
