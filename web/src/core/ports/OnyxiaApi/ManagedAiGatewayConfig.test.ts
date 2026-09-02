import { describe, expect, it } from "vitest";
import { parseManagedAiGatewayConfigFromEnvValue } from "./ManagedAiGatewayConfig";

describe(parseManagedAiGatewayConfigFromEnvValue.name, () => {
    it("returns no entries when the env is empty", () => {
        expect(parseManagedAiGatewayConfigFromEnvValue({ envValue: "" })).toStrictEqual({
            entries: []
        });
    });

    it("parses a single OpenWebUI gateway", () => {
        expect(
            parseManagedAiGatewayConfigFromEnvValue({
                envValue: `{
                    URL: "https://ai.example.com",
                    oidcConfiguration: {
                        clientID: "onyxia-ai",
                        idleSessionLifetimeInSeconds: "300"
                    }
                }`
            })
        ).toStrictEqual({
            entries: [
                {
                    url: "https://ai.example.com",
                    name: undefined,
                    description: undefined,
                    accountCreation: undefined,
                    oidcParams: {
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
        const { entries } = parseManagedAiGatewayConfigFromEnvValue({
            envValue: `[
                {
                    URL: "https://ai-a.example.com",
                    name: "Gateway A",
                    description: { en: "First gateway", fr: "Première gateway" },
                    accountCreation: {
                        title: "Create an account",
                        buttonLabel: { en: "Open", fr: "Ouvrir" }
                    },
                    oidcConfiguration: { clientID: "onyxia-ai-a" }
                },
                {
                    URL: "https://ai-b.example.com",
                    oidcConfiguration: { clientID: "onyxia-ai-b" }
                }
            ]`
        });

        expect(entries).toHaveLength(2);
        expect(entries[0]).toMatchObject({
            url: "https://ai-a.example.com",
            name: "Gateway A",
            description: { en: "First gateway", fr: "Première gateway" },
            accountCreation: {
                title: "Create an account",
                description: undefined,
                buttonLabel: { en: "Open", fr: "Ouvrir" }
            }
        });
        expect(entries[1]?.url).toBe("https://ai-b.example.com");
    });

    it("rejects invalid JSON5", () => {
        expect(() =>
            parseManagedAiGatewayConfigFromEnvValue({ envValue: "{not valid" })
        ).toThrow("The AI env is not a valid JSON5");
    });

    it("requires a dedicated OIDC client", () => {
        expect(() =>
            parseManagedAiGatewayConfigFromEnvValue({
                envValue: `{
                    URL: "https://ai.example.com",
                    oidcConfiguration: {}
                }`
            })
        ).toThrow("The format of the AI env is not valid");
    });
});
