import { describe, expect, it } from "vitest";
import { parseGitProvidersConfigFromEnvValue } from "./GitProvidersConfig";

const parse = (value: unknown) =>
    parseGitProvidersConfigFromEnvValue({ envValue: JSON.stringify(value) });

const gitLab = {
    type: "gitlab",
    url: "https://git.example.com/",
    authentication: {
        ui: { type: "oauth", clientId: "onyxia-app" },
        service: { type: "scoped-access-token" }
    }
};

describe("GIT_PROVIDERS environment configuration", () => {
    it("only lets the users add their own providers when the environment is empty", () => {
        expect(parseGitProvidersConfigFromEnvValue({ envValue: "" })).toStrictEqual({
            description: undefined,
            providers: [],
            disallowUserToAddProviders: false
        });
    });

    it("disables the integration without providers when the users can't add theirs", () => {
        expect(parse({ providers: [], disallowUserToAddProviders: true })).toStrictEqual({
            description: undefined,
            providers: [],
            disallowUserToAddProviders: true
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

        expect(parse({ providers: [bitbucket] }).providers[0].id).toBe("bitbucket.org");
        expect(() =>
            parse({
                providers: [
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
            parse({ providers: [{ ...bitbucket, url: "https://bitbucket.acme.org" }] })
        ).toThrow(/Bitbucket Cloud/);
    });

    it("identifies the providers by displayName, the url can be configured twice", () => {
        expect(
            parse({
                providers: [
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
            }).providers.map(({ id }) => id)
        ).toStrictEqual(["git.example.com", "GitLab (token)"]);
        expect(() => parse({ providers: [gitLab, gitLab] })).toThrow(
            /distinct displayName/
        );
        expect(() =>
            parse({ providers: [{ ...gitLab, displayName: "user:gitlab.com" }] })
        ).toThrow(/user:/);
    });

    it("accepts JSON5 and fills in the defaults", () => {
        expect(
            parseGitProvidersConfigFromEnvValue({
                envValue: `{
                    // A comment
                    providers: [{
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
            providers: [
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
            disallowUserToAddProviders: false
        });
    });

    it("accepts the SSPCloud configuration", () => {
        expect(
            parse({
                providers: [
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
            }).providers.map(({ id }) => id)
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
                providers: [
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
        expect(() => parse({ providers: [gitLab, gitLab] })).toThrow(/git\.example\.com/);
    });

    it("refuses an invalid JSON5", () => {
        expect(() => parseGitProvidersConfigFromEnvValue({ envValue: "{" })).toThrow(
            /JSON5/
        );
    });

    it("refuses an unknown provider type", () => {
        expect(() => parse({ providers: [{ ...gitLab, type: "gitea" }] })).toThrow(
            /not valid/
        );
    });
});
