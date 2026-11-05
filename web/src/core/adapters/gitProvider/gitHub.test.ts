import { describe, it, expect, afterEach, vi } from "vitest";
import { assert } from "tsafe/assert";
import { createGitHubProvider, getGitHubApiUrl } from "./gitHub";
import { createProviderConfig, mockFetch } from "./testUtils";

const gitHub = createGitHubProvider({
    config: createProviderConfig({
        type: "github",
        url: "https://github.com",
        authentication: {
            ui: { type: "personal-access-token" },
            service: { type: "oauth", clientId: "services-app" }
        }
    })
});

describe("getGitHubApiUrl", () => {
    it("github.com", () => {
        expect(getGitHubApiUrl({ url: "https://github.com" })).toBe(
            "https://api.github.com"
        );
    });

    it("Enterprise Cloud with data residency", () => {
        expect(getGitHubApiUrl({ url: "https://acme.ghe.com" })).toBe(
            "https://api.acme.ghe.com"
        );
    });

    it("Enterprise Server", () => {
        expect(getGitHubApiUrl({ url: "https://github.acme.org" })).toBe(
            "https://github.acme.org/api/v3"
        );
    });
});

describe("createGitHubProvider", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("links to the token creation page with the scopes", () => {
        assert(gitHub.userConnection.method === "personal-access-token");

        expect(
            new URL(gitHub.userConnection.tokenCreationUrl).searchParams.get("scopes")
        ).toBe("repo");
    });

    it("maps the user", async () => {
        const { calls } = mockFetch(
            () => new Response(JSON.stringify({ login: "jdoe", name: null, email: null }))
        );

        expect(await gitHub.getUser({ accessToken: "t" })).toStrictEqual({
            username: "jdoe",
            name: "jdoe",
            email: undefined
        });
        expect(calls[0].url).toBe("https://api.github.com/user");
    });

    const respondWithRepositories = (params: {
        fullPaths: string[];
        hasNextPage: boolean;
    }) =>
        new Response(
            JSON.stringify(
                params.fullPaths.map(full_name => ({
                    id: full_name.length,
                    name: full_name.split("/")[1],
                    full_name,
                    description: null,
                    html_url: `https://github.com/${full_name}`,
                    clone_url: `https://github.com/${full_name}.git`,
                    default_branch: "main"
                }))
            ),
            {
                headers: params.hasNextPage
                    ? { link: '<https://api.github.com/user/repos?page=2>; rel="next"' }
                    : {}
            }
        );

    it("reads one page of recent repositories when not searching", async () => {
        const { calls } = mockFetch(() =>
            respondWithRepositories({ fullPaths: ["jdoe/alpha"], hasNextPage: true })
        );

        const { repositories, hasNextPage } = await gitHub.listRepositories({
            accessToken: "t",
            search: " ",
            page: 1
        });

        expect(repositories.map(({ fullPath }) => fullPath)).toStrictEqual([
            "jdoe/alpha"
        ]);
        expect(hasNextPage).toBe(true);
        expect(calls).toHaveLength(1);
        expect(new URL(calls[0].url).searchParams.get("per_page")).toBe("20");
    });

    it("searches beyond the first page, within a limit", async () => {
        const { calls } = mockFetch(({ url }) =>
            respondWithRepositories({
                fullPaths: [`jdoe/page-${new URL(url).searchParams.get("page")}`],
                hasNextPage: true
            })
        );

        const { repositories, hasNextPage } = await gitHub.listRepositories({
            accessToken: "t",
            search: "PAGE-3",
            page: 1
        });

        expect(repositories.map(({ fullPath }) => fullPath)).toStrictEqual([
            "jdoe/page-3"
        ]);
        expect(hasNextPage).toBe(true);
        expect(
            calls.map(({ url }) => new URL(url).searchParams.get("page"))
        ).toStrictEqual(["1", "2", "3"]);
        expect(new URL(calls[0].url).searchParams.get("per_page")).toBe("100");
    });

    it("doesn't announce more when the last page is reached in parallel", async () => {
        const { calls } = mockFetch(({ url }) => {
            const page = new URL(url).searchParams.get("page");

            return respondWithRepositories({
                fullPaths: page === "3" ? [] : [`jdoe/page-${page}`],
                hasNextPage: page === "1"
            });
        });

        const { repositories, hasNextPage } = await gitHub.listRepositories({
            accessToken: "t",
            search: "page",
            page: 1
        });

        expect(repositories.map(({ fullPath }) => fullPath)).toStrictEqual([
            "jdoe/page-1",
            "jdoe/page-2"
        ]);
        expect(hasNextPage).toBe(false);
        expect(calls).toHaveLength(3);
    });

    it("stops searching at the last page", async () => {
        const { calls } = mockFetch(() =>
            respondWithRepositories({ fullPaths: ["jdoe/alpha"], hasNextPage: false })
        );

        const { hasNextPage } = await gitHub.listRepositories({
            accessToken: "t",
            search: "alpha",
            page: 1
        });

        expect(hasNextPage).toBe(false);
        expect(calls).toHaveLength(1);
    });

    it("leaves the services to the device flow", () => {
        assert(gitHub.serviceCredentials.method === "oauth");

        expect(gitHub.serviceCredentials.authorizeAtLaunch).toBe(undefined);
        expect(gitHub.serviceCredentials.helperConfig.deviceAuthorizationUrl).toBe(
            "https://github.com/login/device/code"
        );
    });

    it("lists the branches, filtered on the search", async () => {
        const { calls } = mockFetch(
            () =>
                new Response(
                    JSON.stringify([
                        { name: "main" },
                        { name: "feat/Git" },
                        { name: "dev" }
                    ])
                )
        );

        expect(
            await gitHub.listBranches({
                accessToken: "t",
                repositoryFullPath: "jdoe/alpha",
                search: " git ",
                signal: undefined
            })
        ).toStrictEqual({ branches: ["feat/Git"] });

        expect(new URL(calls[0].url).pathname).toBe("/repos/jdoe/alpha/branches");
    });
});
