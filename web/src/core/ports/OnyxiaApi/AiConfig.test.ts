import { describe, expect, it } from "vitest";
import { parseAiConfigFromEnvValue } from "./AiConfig";

describe(parseAiConfigFromEnvValue.name, () => {
    it("returns no entries when the env is empty", () => {
        expect(parseAiConfigFromEnvValue({ envValue: "" })).toStrictEqual({
            entries: []
        });
    });

    it("parses a single gateway and applies defaults", () => {
        expect(
            parseAiConfigFromEnvValue({
                envValue: `{
                    URL: "https://ai.example.com",
                    oauthProvider: "keycloak",
                    oidcConfiguration: {
                        issuerURI: "https://auth.example.com/realms/onyxia",
                        clientID: "onyxia-ai",
                        idleSessionLifetimeInSeconds: "300"
                    }
                }`
            })
        ).toStrictEqual({
            entries: [
                {
                    id: "onyxia-0",
                    url: "https://ai.example.com",
                    name: undefined,
                    provider: "openai",
                    description: undefined,
                    accountCreation: undefined,
                    oauthProvider: "keycloak",
                    oidcParams: {
                        issuerUri: "https://auth.example.com/realms/onyxia",
                        clientId: "onyxia-ai",
                        extraQueryParams_raw: undefined,
                        scope_spaceSeparated: undefined,
                        idleSessionLifetimeInSeconds: 300
                    }
                }
            ]
        });
    });

    it("parses multiple gateways and localized account creation content", () => {
        const { entries } = parseAiConfigFromEnvValue({
            envValue: `[
                {
                    id: "gateway-a",
                    URL: "https://ai-a.example.com",
                    name: "Gateway A",
                    provider: "mistral",
                    description: { en: "First gateway", fr: "Première gateway" },
                    accountCreation: {
                        title: "Create an account",
                        buttonLabel: { en: "Open", fr: "Ouvrir" }
                    },
                    oauthProvider: "oidc-a"
                },
                {
                    URL: "https://ai-b.example.com",
                    oauthProvider: "oidc-b"
                }
            ]`
        });

        expect(entries).toHaveLength(2);
        expect(entries[0]).toMatchObject({
            id: "gateway-a",
            name: "Gateway A",
            provider: "mistral",
            description: { en: "First gateway", fr: "Première gateway" },
            accountCreation: {
                title: "Create an account",
                description: undefined,
                buttonLabel: { en: "Open", fr: "Ouvrir" }
            }
        });
        expect(entries[1]?.id).toBe("onyxia-1");
    });

    it("rejects invalid JSON5", () => {
        expect(() => parseAiConfigFromEnvValue({ envValue: "{not valid" })).toThrow(
            "The AI env is not a valid JSON5"
        );
    });

    it("rejects an invalid gateway shape", () => {
        expect(() =>
            parseAiConfigFromEnvValue({
                envValue: `{ URL: "https://ai.example.com" }`
            })
        ).toThrow("The format of the AI env is not valid");
    });
});
