import { describe, it, expect, afterEach, vi } from "vitest";
import { assert } from "tsafe/assert";
import { createGitLabProvider } from "./gitLab";
import { GitProviderUnauthorizedError } from "core/ports/GitProvider";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";
import { createProviderConfig, mockFetch, redirectUri, tokenResponse } from "./testUtils";

const createGitLab = (authentication: GitProvidersConfig.Provider["authentication"]) =>
    createGitLabProvider({
        config: createProviderConfig({
            type: "gitlab",
            url: "https://git.example.com",
            authentication
        })
    });

const gitLab_oauth_scoped = createGitLab({
    ui: { type: "oauth", clientId: "onyxia-app" },
    service: { type: "scoped-access-token", lifetimeDays: 30 }
});

const gitLab_oauth_oauth = createGitLab({
    ui: { type: "oauth", clientId: "onyxia-app" },
    service: { type: "oauth", clientId: "services-app" }
});

const getScope = (authorizationUrl: string) =>
    new URL(authorizationUrl).searchParams.get("scope");

describe("createGitLabProvider", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("asks for api only when it has to create tokens", () => {
        for (const [gitLab, expectedScope] of [
            [gitLab_oauth_scoped, "api"],
            [gitLab_oauth_oauth, "read_api"]
        ] as const) {
            assert(gitLab.ui.type === "oauth");

            expect(
                getScope(
                    gitLab.ui.oauth.getAuthorizationUrl({
                        redirectUri,
                        state: "s",
                        codeChallenge: "c"
                    })
                )
            ).toBe(expectedScope);
        }
    });

    it("authorizes the services with their own application and git scopes", () => {
        assert(gitLab_oauth_oauth.service.type === "oauth");

        const { authorization, helperConfig } = gitLab_oauth_oauth.service;

        assert(authorization !== undefined);

        const authorizationUrl = new URL(
            authorization.getAuthorizationUrl({
                redirectUri,
                state: "s",
                codeChallenge: "c"
            })
        );

        expect(authorizationUrl.searchParams.get("client_id")).toBe("services-app");
        expect(authorizationUrl.searchParams.get("scope")).toBe(
            "read_repository write_repository"
        );
        expect(authorizationUrl.searchParams.get("code_challenge_method")).toBe("S256");
        expect(helperConfig).toStrictEqual({
            clientId: "services-app",
            scopes: ["read_repository", "write_repository"],
            authorizationUrl: "https://git.example.com/oauth/authorize",
            tokenUrl: "https://git.example.com/oauth/token",
            deviceAuthorizationUrl: "https://git.example.com/oauth/authorize_device"
        });
    });

    it("prefills the scopes of the personal access token", () => {
        const getScopes = (
            service: GitProvidersConfig.Provider["authentication"]["service"]
        ) => {
            const gitLab = createGitLab({
                ui: { type: "personal-access-token" },
                service
            });

            assert(gitLab.ui.type === "personal-access-token");

            return new URL(gitLab.ui.personalAccessTokenCreationUrl).searchParams.get(
                "scopes"
            );
        };

        expect(getScopes({ type: "personal-access-token" })).toBe(
            "read_api,read_repository,write_repository"
        );
        expect(getScopes({ type: "scoped-access-token", lifetimeDays: 30 })).toBe("api");
        expect(getScopes({ type: "oauth", clientId: "services-app" })).toBe("read_api");
    });

    it("exchanges the code with PKCE", async () => {
        const { calls } = mockFetch(() => tokenResponse("1"));

        assert(gitLab_oauth_scoped.ui.type === "oauth");

        const tokens = await gitLab_oauth_scoped.ui.oauth.exchangeAuthorizationCode({
            code: "the-code",
            codeVerifier: "the-verifier",
            redirectUri
        });

        expect(tokens.accessToken).toBe("access-1");
        expect(tokens.refreshToken).toBe("refresh-1");
        expect(calls[0].url).toBe("https://git.example.com/oauth/token");
        const body = new URLSearchParams(calls[0].init!.body as string);
        expect(body.get("code_verifier")).toBe("the-verifier");
        expect(body.get("client_id")).toBe("onyxia-app");
    });

    it("sends the redirect URI again when refreshing", async () => {
        const { calls } = mockFetch(() => tokenResponse("2"));

        assert(gitLab_oauth_scoped.ui.type === "oauth");

        await gitLab_oauth_scoped.ui.oauth.refreshTokens({
            refreshToken: "r",
            redirectUri
        });

        const body = new URLSearchParams(calls[0].init!.body as string);
        expect(body.get("grant_type")).toBe("refresh_token");
        expect(body.get("refresh_token")).toBe("r");
        expect(body.get("redirect_uri")).toBe(redirectUri);
    });

    it("throws GitProviderUnauthorizedError when the refresh token is rejected", async () => {
        mockFetch(
            () =>
                new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 })
        );

        assert(gitLab_oauth_scoped.ui.type === "oauth");

        await expect(
            gitLab_oauth_scoped.ui.oauth.refreshTokens({ refreshToken: "r", redirectUri })
        ).rejects.toBeInstanceOf(GitProviderUnauthorizedError);
    });

    it("revokes the refresh token", async () => {
        const { calls } = mockFetch(() => new Response("{}"));

        assert(gitLab_oauth_scoped.ui.type === "oauth");
        assert(gitLab_oauth_scoped.ui.oauth.revokeTokens !== undefined);

        await gitLab_oauth_scoped.ui.oauth.revokeTokens({ refreshToken: "r" });

        expect(calls[0].url).toBe("https://git.example.com/oauth/revoke");
        const body = new URLSearchParams(calls[0].init!.body as string);
        expect(body.get("token")).toBe("r");
        expect(body.get("client_id")).toBe("onyxia-app");
    });

    it("lists repositories, never from another host", async () => {
        mockFetch(
            () =>
                new Response(
                    JSON.stringify([
                        {
                            id: 1,
                            name: "p1",
                            path_with_namespace: "g/p1",
                            description: "",
                            web_url: "https://git.example.com/g/p1",
                            http_url_to_repo: "https://git.example.com/g/p1.git",
                            default_branch: "main"
                        },
                        {
                            id: 2,
                            name: "p2",
                            path_with_namespace: "g/p2",
                            description: null,
                            web_url: "https://evil.example.com/g/p2",
                            http_url_to_repo: "https://evil.example.com/g/p2.git"
                        }
                    ]),
                    { headers: { "x-next-page": "" } }
                )
        );

        const { repositories, hasNextPage } = await gitLab_oauth_scoped.listRepositories({
            accessToken: "t",
            search: "",
            page: 1
        });

        expect(repositories.map(({ fullPath }) => fullPath)).toStrictEqual(["g/p1"]);
        expect(hasNextPage).toBe(false);
    });

    it("throws GitProviderUnauthorizedError on 401", async () => {
        mockFetch(() => new Response("", { status: 401 }));

        await expect(
            gitLab_oauth_scoped.getUser({ accessToken: "t" })
        ).rejects.toBeInstanceOf(GitProviderUnauthorizedError);
    });

    it("creates a fine-grained access token on all the repositories", async () => {
        const { calls } = mockFetch(
            () =>
                new Response(
                    JSON.stringify({ id: 42, token: "glpat-x", expires_at: "2026-11-14" })
                )
        );

        assert(gitLab_oauth_scoped.service.type === "scoped-access-token");

        const accessToken = await gitLab_oauth_scoped.service.createAccessToken({
            accessToken: "t",
            name: "onyxia-vscode",
            repositories: "all",
            permission: "read-write",
            expirationTime: new Date("2026-11-14T12:00:00Z").getTime()
        });

        expect(accessToken).toStrictEqual({
            id: "42",
            token: "glpat-x",
            gitUsername: "oauth2",
            expirationTime: new Date("2026-11-14").getTime()
        });
        expect(JSON.parse(calls[0].init!.body as string)).toStrictEqual({
            name: "onyxia-vscode",
            expires_at: "2026-11-14",
            granular_scopes: [
                {
                    access: "personal_projects",
                    permissions: ["download_code", "push_code"]
                },
                { access: "all_memberships", permissions: ["download_code", "push_code"] }
            ]
        });
    });

    it("resolves the projects for a token limited to repositories", async () => {
        const { calls } = mockFetch(({ url }) =>
            url.includes("/projects/")
                ? new Response(JSON.stringify({ id: 7 }))
                : new Response(JSON.stringify({ id: 1, token: "x", expires_at: null }))
        );

        assert(gitLab_oauth_scoped.service.type === "scoped-access-token");

        await gitLab_oauth_scoped.service.createAccessToken({
            accessToken: "t",
            name: "n",
            repositories: { urls: ["https://git.example.com/g/sub/p.git"] },
            permission: "read",
            expirationTime: Date.now()
        });

        expect(calls[0].url).toBe("https://git.example.com/api/v4/projects/g%2Fsub%2Fp");
        expect(JSON.parse(calls[1].init!.body as string).granular_scopes).toStrictEqual([
            {
                access: "selected_memberships",
                permissions: ["download_code"],
                project_ids: [7]
            }
        ]);
    });

    it("fails explicitly when fine-grained tokens are not available", async () => {
        mockFetch(() => new Response("", { status: 400 }));

        assert(gitLab_oauth_scoped.service.type === "scoped-access-token");

        await expect(
            gitLab_oauth_scoped.service.createAccessToken({
                accessToken: "t",
                name: "n",
                repositories: "all",
                permission: "read-write",
                expirationTime: Date.now()
            })
        ).rejects.toThrow(/19\.2/);
    });
});
