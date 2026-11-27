import { describe, expect, it } from "vitest";
import { parseGitForgesConfigFromEnvValue } from "./GitForgesConfig";

const parse = (value: unknown) =>
    parseGitForgesConfigFromEnvValue({ envValue: JSON.stringify(value) });

const gitLab = {
    type: "gitlab",
    url: "https://git.example.com/",
    authentication: {
        ui: { type: "oauth", clientId: "onyxia-app" },
        service: { type: "scoped-access-token" }
    }
};

describe("GIT_FORGES environment configuration", () => {
    it("only lets the users add their own forges when the environment is empty", () => {
        expect(parseGitForgesConfigFromEnvValue({ envValue: "" })).toStrictEqual({
            description: undefined,
            forges: [],
            disallowUserToAddForges: false
        });
    });

    it("disables the integration without forges when the users can't add theirs", () => {
        expect(parse({ forges: [], disallowUserToAddForges: true })).toStrictEqual({
            description: undefined,
            forges: [],
            disallowUserToAddForges: true
        });
    });

    it("accepts Bitbucket Cloud with API tokens only", () => {
        const bitbucket = {
            type: "bitbucket",
            url: "https://bitbucket.org",
            authentication: {
                ui: { type: "personal-access-token" },
                service: { type: "personal-access-token" }
            }
        };

        expect(parse({ forges: [bitbucket] }).forges[0].id).toBe("bitbucket.org");
        expect(() =>
            parse({
                forges: [
                    {
                        ...bitbucket,
                        authentication: {
                            ui: { type: "oauth", clientId: "x" },
                            service: { type: "personal-access-token" }
                        }
                    }
                ]
            })
        ).toThrow(/client secret/);
        expect(() =>
            parse({ forges: [{ ...bitbucket, url: "https://bitbucket.acme.org" }] })
        ).toThrow(/Bitbucket Cloud/);
    });

    it("refuses a forge url that isn't a base url", () => {
        for (const url of [
            "ftp://git.example.com",
            "https://git.example.com?tenant=x",
            "https://git.example.com/#x",
            "https://user:pw@git.example.com"
        ]) {
            expect(() => parse({ forges: [{ ...gitLab, url }] })).toThrow();
        }
    });

    it("identifies the forges by displayName, the url can be configured twice", () => {
        expect(
            parse({
                forges: [
                    gitLab,
                    {
                        ...gitLab,
                        displayName: "GitLab (token)",
                        authentication: {
                            ui: { type: "personal-access-token" },
                            service: { type: "personal-access-token" }
                        }
                    }
                ]
            }).forges.map(({ id }) => id)
        ).toStrictEqual(["git.example.com", "GitLab (token)"]);
        expect(() => parse({ forges: [gitLab, gitLab] })).toThrow(/distinct displayName/);
        expect(() =>
            parse({ forges: [{ ...gitLab, displayName: "user:gitlab.com" }] })
        ).toThrow(/user:/);
    });

    it("accepts JSON5 and fills in the defaults", () => {
        expect(
            parseGitForgesConfigFromEnvValue({
                envValue: `{
                    // A comment
                    forges: [{
                        type: "gitlab",
                        url: "https://git.example.com/",
                        authentication: {
                            ui: { type: "oauth", clientId: "onyxia-app" },
                            service: { type: "scoped-access-token" },
                        },
                    }],
                }`
            })
        ).toStrictEqual({
            description: undefined,
            forges: [
                {
                    id: "git.example.com",
                    type: "gitlab",
                    url: "https://git.example.com",
                    displayName: "git.example.com",
                    logoUrl: undefined,
                    authentication: {
                        ui: { type: "oauth", clientId: "onyxia-app" },
                        service: { type: "scoped-access-token", lifetimeDays: 30 }
                    }
                }
            ],
            disallowUserToAddForges: false
        });
    });

    it("accepts the SSPCloud configuration", () => {
        expect(
            parse({
                forges: [
                    gitLab,
                    {
                        type: "forgejo",
                        url: "https://forgejo.example.com",
                        authentication: {
                            ui: { type: "oauth", clientId: "onyxia-app" },
                            service: { type: "oauth", clientId: "services-app" }
                        }
                    },
                    {
                        type: "github",
                        url: "https://github.com",
                        authentication: {
                            ui: { type: "personal-access-token" },
                            service: { type: "personal-access-token" }
                        }
                    }
                ]
            }).forges.map(({ id }) => id)
        ).toStrictEqual(["git.example.com", "forgejo.example.com", "github.com"]);
    });

    it.each([
        ["github", { type: "oauth", clientId: "x" }, { type: "oauth", clientId: "y" }],
        ["gitlab", { type: "oauth", clientId: "x" }, { type: "personal-access-token" }],
        ["forgejo", { type: "personal-access-token" }, { type: "scoped-access-token" }],
        ["github", { type: "personal-access-token" }, { type: "scoped-access-token" }],
        ["github", { type: "personal-access-token" }, { type: "oauth", clientId: "y" }],
        ["gitlab", { type: "personal-access-token" }, { type: "oauth", clientId: "y" }],
        ["gitlab", { type: "personal-access-token" }, { type: "scoped-access-token" }],
        ["forgejo", { type: "personal-access-token" }, { type: "oauth", clientId: "y" }]
    ])("refuses %s with ui %o and service %o", (type, ui, service) => {
        expect(() =>
            parse({
                forges: [
                    {
                        type,
                        url: "https://git.example.com",
                        authentication: { ui, service }
                    }
                ]
            })
        ).toThrow(/not supported/);
    });

    it("refuses duplicate ids", () => {
        expect(() => parse({ forges: [gitLab, gitLab] })).toThrow(/git\.example\.com/);
    });

    it("refuses an invalid JSON5", () => {
        expect(() => parseGitForgesConfigFromEnvValue({ envValue: "{" })).toThrow(
            /JSON5/
        );
    });

    it("refuses an unknown forge type", () => {
        expect(() => parse({ forges: [{ ...gitLab, type: "gitea" }] })).toThrow(
            /not valid/
        );
    });
});
