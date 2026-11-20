import { describe, it, expect, afterEach, vi } from "vitest";
import { assert } from "tsafe/assert";
import { createForgejoProvider } from "./forgejo";
import { createProviderConfig, mockFetch, redirectUri } from "./testUtils";

const forgejo = createForgejoProvider({
    config: createProviderConfig({
        type: "forgejo",
        url: "https://forgejo.example.com",
        authentication: {
            ui: { type: "oauth", clientId: "onyxia-app" },
            service: { type: "oauth", clientId: "services-app" }
        }
    })
});

describe("createForgejoProvider", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("has no revocation, the user is sent to their applications", () => {
        assert(forgejo.userConnection.method === "oauth");

        expect(forgejo.userConnection.revokeTokens).toBe(undefined);
        expect(forgejo.userConnection.authorizedApplicationsUrl).toBe(
            "https://forgejo.example.com/user/settings/applications"
        );
    });

    it("maps the user", async () => {
        mockFetch(
            () =>
                new Response(JSON.stringify({ login: "jdoe", full_name: "", email: "" }))
        );

        expect(await forgejo.getUser({ accessToken: "t" })).toStrictEqual({
            username: "jdoe",
            name: "jdoe",
            email: undefined
        });
    });

    it("lists repositories with the total count", async () => {
        const { calls } = mockFetch(
            () =>
                new Response(
                    JSON.stringify({
                        data: [
                            {
                                id: 1,
                                name: "r",
                                full_name: "jdoe/r",
                                html_url: "https://forgejo.example.com/jdoe/r",
                                clone_url: "https://forgejo.example.com/jdoe/r.git",
                                default_branch: "main"
                            },
                            {
                                id: 2,
                                name: "empty",
                                full_name: "jdoe/empty",
                                html_url: "https://forgejo.example.com/jdoe/empty",
                                clone_url: "https://forgejo.example.com/jdoe/empty.git",
                                default_branch: "main",
                                empty: true
                            }
                        ]
                    }),
                    { headers: { "x-total-count": "21" } }
                )
        );

        const { repositories, hasNextPage } = await forgejo.listRepositories({
            accessToken: "t",
            search: "r",
            page: 1
        });

        expect(new URL(calls[0].url).searchParams.get("q")).toBe("r");
        expect(repositories[0].httpCloneUrl).toBe(
            "https://forgejo.example.com/jdoe/r.git"
        );
        expect(hasNextPage).toBe(true);
        // An empty repository has a default branch that doesn't exist yet
        expect(repositories.map(({ defaultBranch }) => defaultBranch)).toStrictEqual([
            "main",
            undefined
        ]);
    });

    it("authorizes the services with their own application, without device flow", () => {
        assert(forgejo.serviceCredentials.method === "oauth");

        const { authorizeAtLaunch, helperConfig } = forgejo.serviceCredentials;

        assert(authorizeAtLaunch !== undefined);

        expect(
            new URL(
                authorizeAtLaunch.getAuthorizationUrl({
                    redirectUri,
                    state: "s",
                    codeChallenge: "c"
                })
            ).searchParams.get("client_id")
        ).toBe("services-app");
        expect(helperConfig.deviceAuthorizationUrl).toBe(undefined);
        expect(helperConfig.tokenUrl).toBe(
            "https://forgejo.example.com/login/oauth/access_token"
        );
    });

    it("fails when the service gets no refresh token", async () => {
        mockFetch(
            () =>
                new Response(
                    JSON.stringify({
                        access_token: "a",
                        token_type: "bearer",
                        expires_in: 3600
                    })
                )
        );

        assert(forgejo.serviceCredentials.method === "oauth");
        assert(forgejo.serviceCredentials.authorizeAtLaunch !== undefined);

        await expect(
            forgejo.serviceCredentials.authorizeAtLaunch.exchangeAuthorizationCode({
                code: "c",
                codeVerifier: "v",
                redirectUri
            })
        ).rejects.toThrow(/refresh token/);
    });

    it("lists the branches, filtered on the search", async () => {
        const { calls } = mockFetch(
            () => new Response(JSON.stringify([{ name: "main" }, { name: "dev" }]))
        );

        expect(
            await forgejo.listBranches({
                accessToken: "t",
                repositoryFullPath: "jdoe/alpha",
                search: "ma",
                signal: undefined
            })
        ).toStrictEqual({ branches: ["main"] });

        expect(new URL(calls[0].url).pathname).toBe("/api/v1/repos/jdoe/alpha/branches");
    });
});
