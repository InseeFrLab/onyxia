import type { ArrayOrNot } from "core/tools/ArrayOrNot";
import { type LocalizedString, zLocalizedString } from "./Language";
import { z } from "zod";
import { assert, type Equals, id } from "tsafe";
import JSON5 from "json5";
import type { ApiTypes } from "core/adapters/onyxiaApi/ApiTypes";
import type { OidcParams_Partial } from "./OidcParams";

/**
 * JSON5 configuration accepted by the `AI` environment variable. Controls the
 * Account > AI tab and the `ai` launch context that charts can inject into services.
 * AI is available only to logged-in users.
 *
 * An empty environment value enables AI with no admin-provided providers and lets
 * users add their own. When an object is supplied, `providers` is required, even
 * when disabling AI: use `{ disable: true, providers: [] }`.
 *
 * This configuration is exposed to the browser. API keys are supplied by users or
 * obtained through token exchange at runtime, rather than stored here.
 */
type AI_EnvValue_ExpectedShape = {
    /**
     * Hides Account > AI and supplies an empty, disabled `ai` launch context.
     * @default false
     */
    disable?: boolean;
    /**
     * Prevents users from adding their own providers. Admin-provided providers can
     * still be configured by users, and previously saved personal providers remain
     * available; this does not restrict the provider list to the ones declared here.
     * @default false
     */
    disallowUserToAddProviders?: boolean;
    /**
     * Markdown displayed below the "AI Providers" heading in Account > AI. Accepts
     * a string or translations such as `{ en: "...", fr: "..." }`. Omit to show no
     * introduction.
     */
    description?: LocalizedString;
    /**
     * Providers provisioned by the administrator, as a single object or an array.
     * Use `[]` to provision none. They appear before personal providers; this order
     * also determines the fallback default model when the user has not chosen one.
     */
    providers: ArrayOrNot<AI_EnvValue_ExpectedShape.Provider>;
};

namespace AI_EnvValue_ExpectedShape {
    /**
     * An admin-provided connection whose name, protocol and API base users cannot
     * edit. Users can select its models and supply an API key when requested.
     */
    export type Provider = {
        /**
         * Display name and persistent provider identifier. Trimmed on parsing, must
         * be unique among configured providers, and cannot contain `/` because launch
         * model identifiers use `<providerName>/<modelId>`.
         *
         * Keep this stable: saved API keys, excluded models and the user's default
         * model refer to it by name. A personal provider with the same name remains
         * visible for renaming or deletion but is excluded from the launch context.
         */
        name: string;
        /**
         * Protocol used to list models and exposed to charts as `ai.providers[].type`.
         * `anthropic` uses Anthropic headers; all other types use OpenAI-compatible
         * model listing with Bearer authentication when a key is available.
         */
        providerType: AiConfig.SupportedAiProviderType;
        /**
         * Absolute API root, including any required prefix such as `/v1`. Trailing
         * slashes are removed, and model discovery requests `<apiBase>/models`
         * directly from the browser. The same root is passed to launched services.
         */
        apiBase: string;
        /** Help displayed in this provider's management dialog. Omit to hide it. */
        documentation?: {
            /**
             * Plain text, either a string or translations such as
             * `{ en: "...", fr: "..." }`.
             */
            mainText: LocalizedString;
            /**
             * Links opened in a new tab, with localized labels and absolute URLs.
             * Defaults to an empty list.
             */
            links?: AiConfig.Documentation.Link[];
        };
        /**
         * Image displayed on the provider card: one absolute URL for both themes or
         * `{ light: "https://...", dark: "https://..." }`. Omit to show no logo;
         * admin-provided providers do not fall back to the protocol's built-in logo.
         */
        logoUrl?: AiConfig.LogoUrl;
        /**
         * How the provider's credentials are obtained. An authenticated provider
         * with at least one selected model is included in the launch context along
         * with its API key; `none` providers are included without a key.
         */
        authentification:
            | {
                  /** No credentials required; model requests omit the API key. */
                  type: "none";
              }
            | {
                  type: "api-key";
                  /** The user enters their own API key in the provider's management dialog. */
                  obtentionMethod: "user-provided";
              }
            | {
                  type: "api-key";
                  /**
                   * Exchanges an OIDC access token for an Open WebUI API token via
                   * `POST <apiBase>/v1/auths/oauth/oidc/token/exchange`. The resulting
                   * token is refreshed before subsequent service launches.
                   */
                  obtentionMethod: "open-webui-oidc-token-exchange";
                  /**
                   * Overrides Onyxia's login OIDC settings for this provider; omitted
                   * fields inherit the instance settings. For example, set only
                   * `clientID` to use a dedicated client on the same issuer.
                   *
                   * Accepts `issuerURI`, `clientID`, `extraQueryParams` (URL query
                   * string), `scope` (space-separated), and
                   * `idleSessionLifetimeInSeconds` (number or numeric string).
                   */
                  oidcConfiguration?: Partial<ApiTypes.OidcConfiguration>;
              };
        /**
         * Explicit model IDs offered instead of the discovered list. Duplicates are
         * removed, preserving order. Omit to use the provider's `/models` response;
         * `[]` deliberately offers no models and excludes this provider from launches.
         *
         * Model discovery is still attempted to report connection status, but an
         * explicit list remains selectable if that request fails (for example, when
         * only launched services can reach the provider). Authentication must still
         * succeed. All offered models are selected by default unless the user has
         * excluded them; the first selected model is a fallback for the default.
         */
        models?: string[];
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
