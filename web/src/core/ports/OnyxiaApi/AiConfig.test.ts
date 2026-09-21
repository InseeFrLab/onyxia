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
    it.each([
        { providers: [provider, provider] },
        { providers: { ...provider, name: "a/b" } },
        { providers: { ...provider, providerType: "unknown" } },
        { providers: { ...provider, authentification: { type: "api-key" } } }
    ])("rejects invalid or ambiguous providers", value => {
        expect(() => parse(value)).toThrow();
    });
    it("reports invalid JSON5", () => {
        expect(() => parseAiConfigFromEnvValue({ envValue: "{" })).toThrow(
            "not a valid JSON5"
        );
    });
});
