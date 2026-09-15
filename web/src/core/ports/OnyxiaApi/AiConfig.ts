import type { ArrayOrNot } from "core/tools/ArrayOrNot";
import { type LocalizedString, zLocalizedString } from "./Language";
import { z } from "zod";
import { assert, type Equals, id } from "tsafe";
import JSON5 from "json5";

type AI_EnvValue_ExpectedShape = {
    disable?: boolean;
    disallowUserToAddProviders?: boolean;
    providers: ArrayOrNot<AI_EnvValue_ExpectedShape.Provider>;
};

namespace AI_EnvValue_ExpectedShape {
    export type Provider = {
        name: string;
        providerType: AiConfig.SupportedAiProviderType;
        apiBase: string;
        description?: LocalizedString;
        authentification:
            | { type: "none" }
            | {
                  type: "api-key";
                  obtentionMethod: "user-provided";
              }
            | {
                  type: "api-key";
                  obtentionMethod: "open-webui-oidc-token-exchange";
                  allowFallbackToUserProvidedApiKey?: boolean;
                  oidcConfiguration: {
                      clientID: string;
                      extraQueryParams?: string;
                      scope?: string;
                  };
              };
        models?: string[] /** When undefined, the models will be fetched from the provider model endpoint */;
    };
}

const zAI_EnvValue_ExpectedShape = (() => {
    type TargetType = AI_EnvValue_ExpectedShape;

    const zProvider = z.object({
        name: z
            .string()
            .trim()
            .refine(name => !name.includes("/")),
        providerType: z.enum([
            "openai-compatible",
            "openai",
            "anthropic",
            "mistral",
            "deepseek"
        ]),
        apiBase: z.string().url(),
        description: zLocalizedString.optional(),
        authentification: z.union([
            z.object({ type: z.literal("none") }),
            z.object({
                type: z.literal("api-key"),
                obtentionMethod: z.literal("user-provided")
            }),
            z.object({
                type: z.literal("api-key"),
                obtentionMethod: z.literal("open-webui-oidc-token-exchange"),
                allowFallbackToUserProvidedApiKey: z.boolean().optional(),
                oidcConfiguration: z.object({
                    clientID: z.string().min(1),
                    extraQueryParams: z.string().optional(),
                    scope: z.string().optional()
                })
            })
        ]),
        models: z.array(z.string().min(1)).optional()
    });
    const zTargetType = z.object({
        disable: z.boolean().optional(),
        disallowUserToAddProviders: z.boolean().optional(),
        providers: z.union([zProvider, z.array(zProvider)])
    });

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();

export type AiConfig = {
    disable: boolean;
    disallowUserToAddProviders: boolean;
    providers: ArrayOrNot<AiConfig.Provider>;
};

export namespace AiConfig {
    export type Provider = {
        name: string;
        providerType: SupportedAiProviderType;
        apiBase: string;
        description: LocalizedString | undefined;
        authentification:
            | { type: "none" }
            | {
                  type: "api-key";
                  obtentionMethod: "user-provided";
              }
            | {
                  type: "api-key";
                  obtentionMethod: "open-webui-oidc-token-exchange";
                  allowFallbackToUserProvidedApiKey: boolean;
                  oidcConfig: {
                      clientId: string;
                      extraQueryParams: string | undefined;
                      scope: string | undefined;
                  };
              };
        /** When undefined, the models will be fetched from the provider model endpoint */
        models: string[] | undefined;
    };

    export type SupportedAiProviderType =
        | "openai-compatible"
        | "openai"
        | "anthropic"
        | "mistral"
        | "deepseek";
}

export function parseAiConfigFromEnvValue(params: { envValue: string }): AiConfig {
    const { envValue } = params;

    if (envValue === "") {
        return {
            disable: false,
            disallowUserToAddProviders: false,
            providers: []
        };
    }

    let parsedValue: unknown;
    try {
        parsedValue = JSON5.parse(envValue);
    } catch {
        throw new Error("The AI env is not a valid JSON5");
    }
    let config: AI_EnvValue_ExpectedShape;
    try {
        config = zAI_EnvValue_ExpectedShape.parse(parsedValue);
    } catch (error) {
        throw new Error(`The format of the AI env is not valid: ${String(error)}`);
    }
    const providers = Array.isArray(config.providers)
        ? config.providers
        : [config.providers];
    assert(
        new Set(providers.map(p => p.name)).size === providers.length,
        "AI provider names must be unique"
    );
    return {
        disable: config.disable ?? false,
        disallowUserToAddProviders: config.disallowUserToAddProviders ?? false,
        providers: providers.map(
            (provider): AiConfig.Provider => ({
                name: provider.name,
                providerType: provider.providerType,
                apiBase: provider.apiBase.replace(/\/+$/, ""),
                description: provider.description,
                models:
                    provider.models === undefined
                        ? undefined
                        : [...new Set(provider.models)],
                authentification:
                    provider.authentification.type === "none" ||
                    provider.authentification.obtentionMethod === "user-provided"
                        ? provider.authentification
                        : {
                              type: "api-key",
                              obtentionMethod: "open-webui-oidc-token-exchange",
                              allowFallbackToUserProvidedApiKey:
                                  provider.authentification
                                      .allowFallbackToUserProvidedApiKey ?? false,
                              oidcConfig: {
                                  clientId:
                                      provider.authentification.oidcConfiguration
                                          .clientID,
                                  extraQueryParams:
                                      provider.authentification.oidcConfiguration
                                          .extraQueryParams,
                                  scope: provider.authentification.oidcConfiguration.scope
                              }
                          }
            })
        )
    };
}
