import { describe, it, expect, afterEach, vi } from "vitest";
import { assert } from "tsafe/assert";
import { GitProviderUnauthorizedError } from "core/ports/GitProvider";
import { createBitbucketProvider } from "./bitbucket";
import { createProviderConfig, mockFetch } from "./testUtils";

const bitbucket = createBitbucketProvider({
    config: createProviderConfig({
        type: "bitbucket",
        url: "https://bitbucket.org",
        authentication: {
            ui: { type: "personal-access-token" },
            service: { type: "personal-access-token" }
        }
    })
});

const repository = (full_name: string, cloneHost = "bitbucket.org") => ({
    uuid: `{${full_name}}`,
    name: full_name.split("/")[1],
    full_name,
    description: "",
    links: {
        html: { href: `https://bitbucket.org/${full_name}` },
        clone: [
            { name: "https", href: `https://jdoe@${cloneHost}/${full_name}.git` },
            { name: "ssh", href: `git@${cloneHost}:${full_name}.git` }
        ]
    },
    mainbranch: { name: "main" }
});

describe("createBitbucketProvider", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("pairs the API token with the static git username", () => {
        assert(bitbucket.ui.type === "personal-access-token");

        expect(bitbucket.ui.personalAccessTokenCreationUrl).toBe(
            "https://id.atlassian.com/manage-profile/security/api-tokens"
        );
        expect(bitbucket.service).toStrictEqual({
            type: "personal-access-token",
            gitUsername: "x-bitbucket-api-token-auth"
        });
    });

    it("maps the user and its primary email, with the API token as a Bearer", async () => {
        const { calls } = mockFetch(({ url }) =>
            url.endsWith("/user/emails")
                ? new Response(
                      JSON.stringify({
                          values: [
                              {
                                  email: "old@x.org",
                                  is_primary: false,
                                  is_confirmed: true
                              },
                              {
                                  email: "jane@x.org",
                                  is_primary: true,
                                  is_confirmed: true
                              }
                          ]
                      })
                  )
                : new Response(
                      JSON.stringify({ username: "jdoe", display_name: "Jane Doe" })
                  )
        );

        expect(await bitbucket.getUser({ accessToken: "t" })).toStrictEqual({
            username: "jdoe",
            name: "Jane Doe",
            email: "jane@x.org"
        });
        expect(calls.map(({ url }) => url)).toStrictEqual([
            "https://api.bitbucket.org/2.0/user",
            "https://api.bitbucket.org/2.0/user/emails"
        ]);
        expect(new Headers(calls[0].init?.headers).get("Authorization")).toBe("Bearer t");
    });

    it("falls back to no email when the emails can't be read", async () => {
        mockFetch(({ url }) =>
            url.endsWith("/user/emails")
                ? new Response("", { status: 403 })
                : new Response(JSON.stringify({ username: "jdoe" }))
        );

        expect(await bitbucket.getUser({ accessToken: "t" })).toStrictEqual({
            username: "jdoe",
            name: "jdoe",
            email: undefined
        });
    });

    it("reports a rejected token", async () => {
        mockFetch(() => new Response("", { status: 401 }));

        await expect(bitbucket.getUser({ accessToken: "t" })).rejects.toBeInstanceOf(
            GitProviderUnauthorizedError
        );
    });

    it("searches the repositories, without the username in the clone url", async () => {
        const { calls } = mockFetch(
            () =>
                new Response(
                    JSON.stringify({
                        values: [
                            repository("jdoe/alpha"),
                            repository("jdoe/elsewhere", "evil.example.com")
                        ],
                        next: "https://api.bitbucket.org/2.0/repositories?page=2"
                    })
                )
        );

        const { repositories, hasNextPage } = await bitbucket.listRepositories({
            accessToken: "t",
            search: " alp ",
            page: 1
        });

        expect(repositories).toStrictEqual([
            {
                id: "{jdoe/alpha}",
                name: "alpha",
                fullPath: "jdoe/alpha",
                description: undefined,
                webUrl: "https://bitbucket.org/jdoe/alpha",
                httpCloneUrl: "https://bitbucket.org/jdoe/alpha.git",
                defaultBranch: "main"
            }
        ]);
        expect(hasNextPage).toBe(true);

        const { searchParams } = new URL(calls[0].url);

        expect(searchParams.get("role")).toBe("member");
        expect(searchParams.get("q")).toBe('full_name ~ "alp"');
    });
});
