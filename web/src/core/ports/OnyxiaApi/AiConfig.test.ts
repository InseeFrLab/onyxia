import { describe, expect, it } from "vitest";
import { parseAiConfigFromEnvValue } from "./AiConfig";
const provider = {
    name: "Local",
    providerType: "openai-compatible",
    apiBase: "https://example.com/v1/",
    authentification: { type: "none" }
};
const parse = (value: unknown) =>
    parseAiConfigFromEnvValue({ envValue: JSON.stringify(value) });
describe("AI environment configuration", () => {
    it("enables personal providers when the environment is empty", () => {
        expect(parseAiConfigFromEnvValue({ envValue: "" })).toEqual({
            disable: false,
            disallowUserToAddProviders: false,
            description: undefined,
            providers: []
        });
    });
    it("accepts JSON5 and normalizes a single provider", () => {
        expect(
            parseAiConfigFromEnvValue({
                envValue:
                    "{providers: {name: 'Local', providerType: 'openai', apiBase: 'https://example.com/v1/', authentification: {type: 'none'},},}"
            })
        ).toMatchObject({
            disable: false,
            disallowUserToAddProviders: false,
            providers: [
                { name: "Local", apiBase: "https://example.com/v1", models: undefined }
            ]
        });
    });
    it("normalizes OIDC configuration", () => {
        expect(
            parse({
                providers: {
                    ...provider,
                    authentification: {
                        type: "api-key",
                        obtentionMethod: "open-webui-oidc-token-exchange",
                        oidcConfiguration: { clientID: "client" }
                    }
                }
            })
        ).toMatchObject({
            providers: [
                {
                    authentification: {
                        oidcParams: {
                            clientId: "client",
                            issuerUri: undefined,
                            scope_spaceSeparated: undefined,
                            extraQueryParams_raw: undefined,
                            idleSessionLifetimeInSeconds: undefined
                        }
                    }
                }
            ]
        });
    });
    it("allows OIDC token exchange without a provider-specific OIDC configuration", () => {
        expect(
            parse({
                providers: {
                    ...provider,
                    authentification: {
                        type: "api-key",
                        obtentionMethod: "open-webui-oidc-token-exchange"
                    }
                }
            })
        ).toMatchObject({
            providers: [
                {
                    authentification: {
                        oidcParams: {
                            clientId: undefined,
                            issuerUri: undefined,
                            scope_spaceSeparated: undefined,
                            extraQueryParams_raw: undefined,
                            idleSessionLifetimeInSeconds: undefined
                        }
                    }
                }
            ]
        });
    });
    it("distinguishes a static empty list from models to discover", () => {
        expect(parse({ providers: { ...provider, models: [] } }).providers).toMatchObject(
            [{ models: [] }]
        );
    });
    it("accepts a logo url, or one per theme", () => {
        const logoUrl_themed = {
            light: "https://example.com/logo-light.svg",
            dark: "https://example.com/logo-dark.svg"
        };

        expect(
            parse({
                providers: [
                    { ...provider, name: "A", logoUrl: "https://example.com/logo.png" },
                    { ...provider, name: "B", logoUrl: logoUrl_themed },
                    { ...provider, name: "C" }
                ]
            }).providers.map(({ logoUrl }) => logoUrl)
        ).toStrictEqual(["https://example.com/logo.png", logoUrl_themed, undefined]);
    });
    it("accepts a documentation, the links being optional", () => {
        const link = {
            label: { en: "Read more", fr: "En savoir plus" },
            url: "https://docs.example.com"
        };

        expect(
            parse({
                providers: [
                    {
                        ...provider,
                        name: "A",
                        documentation: { mainText: "Some help", links: [link] }
                    },
                    { ...provider, name: "B", documentation: { mainText: "Some help" } },
                    { ...provider, name: "C" }
                ]
            }).providers.map(({ documentation }) => documentation)
        ).toStrictEqual([
            { mainText: "Some help", links: [link] },
            { mainText: "Some help", links: [] },
            undefined
        ]);
    });
    it.each([
        { providers: [provider, provider] },
        { providers: { ...provider, name: "a/b" } },
        { providers: { ...provider, providerType: "unknown" } },
        { providers: { ...provider, authentification: { type: "api-key" } } },
        { providers: { ...provider, logoUrl: "not an url" } },
        { providers: { ...provider, documentation: { links: [] } } },
        {
            providers: {
                ...provider,
                documentation: {
                    mainText: "Some help",
                    links: [{ label: "Docs", url: "not an url" }]
                }
            }
        },
        { providers: { ...provider, logoUrl: { light: "https://example.com/logo.svg" } } }
    ])("rejects invalid or ambiguous providers", value => {
        expect(() => parse(value)).toThrow();
    });
    it("reports invalid JSON5", () => {
        expect(() => parseAiConfigFromEnvValue({ envValue: "{" })).toThrow(
            "not a valid JSON5"
        );
    });
    it("keeps the description written by the admin", () => {
        expect(
            parse({
                description: { en: "[Read more](https://example.com)", fr: "Lire" },
                providers: provider
            }).description
        ).toEqual({ en: "[Read more](https://example.com)", fr: "Lire" });
    });
});
