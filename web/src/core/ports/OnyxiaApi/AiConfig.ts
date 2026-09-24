import type { ArrayOrNot } from "core/tools/ArrayOrNot";
import { type LocalizedString, zLocalizedString } from "./Language";
import { z } from "zod";
import { assert, type Equals, id } from "tsafe";
import JSON5 from "json5";
import type { ApiTypes } from "core/adapters/onyxiaApi/ApiTypes";
import type { OidcParams_Partial } from "./OidcParams";

type AI_EnvValue_ExpectedShape = {
    disable?: boolean;
    disallowUserToAddProviders?: boolean;
    description?: LocalizedString;
    providers: ArrayOrNot<AI_EnvValue_ExpectedShape.Provider>;
};

namespace AI_EnvValue_ExpectedShape {
    export type Provider = {
        name: string;
        providerType: AiConfig.SupportedAiProviderType;
        apiBase: string;
        documentation?: {
            mainText: LocalizedString;
            links?: AiConfig.Documentation.Link[];
        };
        logoUrl?: AiConfig.LogoUrl;
        authentification:
            | { type: "none" }
            | {
                  type: "api-key";
                  obtentionMethod: "user-provided";
              }
            | {
                  type: "api-key";
                  obtentionMethod: "open-webui-oidc-token-exchange";
                  oidcConfiguration?: Partial<ApiTypes.OidcConfiguration>;
              };
        models?: string[] /** When undefined, the models will be fetched from the provider model endpoint */;
    };
}

const zAI_EnvValue_ExpectedShape = (() => {
    type TargetType = AI_EnvValue_ExpectedShape;

    const zOidcConfiguration = z.custom<Partial<ApiTypes.OidcConfiguration>>(
        value =>
            z
                .object({
                    issuerURI: z.string().optional(),
                    clientID: z.string().min(1).optional(),
                    extraQueryParams: z.string().optional(),
                    scope: z.string().optional(),
                    idleSessionLifetimeInSeconds: z
                        .union([z.number(), z.string()])
                        .optional()
                })
                .safeParse(value).success
    );

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
        documentation: z
            .object({
                mainText: zLocalizedString,
                links: z
                    .array(z.object({ label: zLocalizedString, url: z.string().url() }))
                    .optional()
            })
            .optional(),
        logoUrl: z
            .union([
                z.string().url(),
                z.object({ light: z.string().url(), dark: z.string().url() })
            ])
            .optional(),
        authentification: z.union([
            z.object({ type: z.literal("none") }),
            z.object({
                type: z.literal("api-key"),
                obtentionMethod: z.literal("user-provided")
            }),
            z.object({
                type: z.literal("api-key"),
                obtentionMethod: z.literal("open-webui-oidc-token-exchange"),
                oidcConfiguration: zOidcConfiguration.optional()
            })
        ]),
        models: z.array(z.string().min(1)).optional()
    });
    const zTargetType = z.object({
        disable: z.boolean().optional(),
        disallowUserToAddProviders: z.boolean().optional(),
        description: zLocalizedString.optional(),
        providers: z.union([zProvider, z.array(zProvider)])
    });

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();

export type AiConfig = {
    disable: boolean;
    disallowUserToAddProviders: boolean;
    /** Markdown, written by the admin, introducing AI in the account tab */
    description: LocalizedString | undefined;
    providers: AiConfig.Provider[];
};

export namespace AiConfig {
    export type Provider = {
        name: string;
        providerType: SupportedAiProviderType;
        apiBase: string;
        documentation: Documentation | undefined;
        logoUrl: LogoUrl | undefined;
        authentification:
            | { type: "none" }
            | {
                  type: "api-key";
                  obtentionMethod: "user-provided";
              }
            | {
                  type: "api-key";
                  obtentionMethod: "open-webui-oidc-token-exchange";
                  oidcParams: OidcParams_Partial;
              };
        /** When undefined, the models will be fetched from the provider model endpoint */
        models: string[] | undefined;
    };

    /** Help about the provider, written by the admin, displayed when managing it. */
    export type Documentation = {
        mainText: LocalizedString;
        links: Documentation.Link[];
    };

    export namespace Documentation {
        export type Link = { label: LocalizedString; url: string };
    }

    /** An image url, or one url per theme like the other logos an admin can provide. */
    export type LogoUrl = string | { light: string; dark: string };

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
            description: undefined,
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
        description: config.description,
        providers: providers.map(
            (provider): AiConfig.Provider => ({
                name: provider.name,
                providerType: provider.providerType,
                apiBase: provider.apiBase.replace(/\/+$/, ""),
                documentation:
                    provider.documentation === undefined
                        ? undefined
                        : {
                              mainText: provider.documentation.mainText,
                              links: provider.documentation.links ?? []
                          },
                logoUrl: provider.logoUrl,
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
                              oidcParams: id<OidcParams_Partial>({
                                  issuerUri:
                                      provider.authentification.oidcConfiguration
                                          ?.issuerURI,
                                  clientId:
                                      provider.authentification.oidcConfiguration
                                          ?.clientID,
                                  extraQueryParams_raw:
                                      provider.authentification.oidcConfiguration
                                          ?.extraQueryParams,
                                  scope_spaceSeparated:
                                      provider.authentification.oidcConfiguration?.scope,
                                  idleSessionLifetimeInSeconds: (() => {
                                      const value =
                                          provider.authentification.oidcConfiguration
                                              ?.idleSessionLifetimeInSeconds;

                                      if (value === "" || value === undefined) {
                                          return undefined;
                                      }

                                      if (typeof value === "number") {
                                          return value;
                                      }

                                      return parseInt(value);
                                  })()
                              })
                          }
            })
        )
    };
}
