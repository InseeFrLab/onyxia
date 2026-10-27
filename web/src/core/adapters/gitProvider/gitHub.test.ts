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

    it("leaves the services to the device flow", () => {
        assert(gitHub.serviceCredentials.method === "oauth");

        expect(gitHub.serviceCredentials.authorizeAtLaunch).toBe(undefined);
        expect(gitHub.serviceCredentials.helperConfig.deviceAuthorizationUrl).toBe(
            "https://github.com/login/device/code"
        );
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

    it("filters the repositories by search, and follows the Link header", async () => {
        mockFetch(
            () =>
                new Response(
                    JSON.stringify(
                        ["jdoe/alpha", "jdoe/beta"].map((full_name, id) => ({
                            id,
                            name: full_name.split("/")[1],
                            full_name,
                            description: null,
                            html_url: `https://github.com/${full_name}`,
                            clone_url: `https://github.com/${full_name}.git`,
                            default_branch: "main"
                        }))
                    ),
                    {
                        headers: {
                            link: '<https://api.github.com/user/repos?page=2>; rel="next"'
                        }
                    }
                )
        );

        const { repositories, hasNextPage } = await gitHub.listRepositories({
            accessToken: "t",
            search: "BET",
            page: 1
        });

        expect(repositories.map(({ fullPath }) => fullPath)).toStrictEqual(["jdoe/beta"]);
        expect(hasNextPage).toBe(true);
    });
});
