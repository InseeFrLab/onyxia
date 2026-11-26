import { type LocalizedString, zLocalizedString } from "./Language";
import { z } from "zod";
import { assert, type Equals, id } from "tsafe";
import JSON5 from "json5";
import type { ThemedAssetUrl } from "onyxia-ui";

/**
 * JSON5 configuration accepted by the `GIT_PROVIDERS` environment variable
 * (`gitProviders` in the region configuration). Controls Account > Git and the
 * `git` launch context that charts use to clone and push from the services.
 *
 * Omitting it (an empty `GIT_PROVIDERS`) enables the integration with no
 * admin-provided provider: users add their own. To disable it, use
 * `{ providers: [], disallowUserToAddProviders: true }`.
 *
 * This configuration is exposed to the browser and must not contain secrets: the
 * OAuth applications are public clients, without secret.
 */
type GIT_PROVIDERS_EnvValue_ExpectedShape = {
    /**
     * Markdown displayed below the "Git profiles" heading in Account > Git. Accepts
     * a string or translations such as `{ en: "...", fr: "..." }`. Omit to show the
     * default text.
     */
    description?: LocalizedString;
    /**
     * Providers provisioned by the administrator. Use `[]` to provision none.
     */
    providers: GIT_PROVIDERS_EnvValue_ExpectedShape.Provider[];
    /**
     * Prevents users from adding their own providers (gitlab.com, github.com...)
     * with a personal access token.
     * @default false
     */
    disallowUserToAddProviders?: boolean;
};

namespace GIT_PROVIDERS_EnvValue_ExpectedShape {
    export type Provider = {
        /** `bitbucket` is Bitbucket Cloud only (`https://bitbucket.org`). */
        type: "gitlab" | "forgejo" | "github" | "bitbucket";
        /** Base URL of the forge, for example `https://gitlab.example.com`. */
        url: string;
        /**
         * Name displayed in Account > Git. Must be unique among the providers.
         *
         * Keep it stable: the user's tokens and sessions are saved under it, so
         * renaming a provider signs its users out.
         * @default the host of `url`
         */
        displayName?: string;
        /**
         * One absolute URL for both themes or `{ light: "https://...", dark: "https://..." }`.
         * @default the logo of the forge type
         */
        logoUrl?: ThemedAssetUrl;
        /**
         * Supported combinations (`ui` / `service`):
         * - `personal-access-token` / `personal-access-token`: every forge type.
         * - `oauth` / `oauth`: GitLab, Forgejo.
         * - `oauth` / `scoped-access-token`: GitLab 19.2 or later (recommended).
         *
         * Onyxia refuses any other combination at startup.
         */
        authentication: {
            /** How Onyxia accesses the forge to list the user's repositories and branches. */
            ui:
                | {
                      /** The user signs in to the forge through a popup. */
                      type: "oauth";
                      /** The public OAuth application registered for Onyxia. */
                      clientId: string;
                  }
                | {
                      /** The user pastes a token in Account > Git. */
                      type: "personal-access-token";
                  };
            /** What the launched services receive to clone and push. */
            service:
                | {
                      /** The token the user pasted in Account > Git. */
                      type: "personal-access-token";
                  }
                | {
                      /**
                       * Onyxia creates a token dedicated to the service, limited to
                       * cloning and pushing, when the user clicks Launch. GitLab only.
                       */
                      type: "scoped-access-token";
                      /** @default 30 */
                      lifetimeDays?: number;
                  }
                | {
                      /** The service gets its own OAuth authorization when the user clicks Launch. */
                      type: "oauth";
                      /** A public OAuth application distinct from Onyxia's (`ui.clientId`). */
                      clientId: string;
                  };
        };
    };
}

const zGIT_PROVIDERS_EnvValue_ExpectedShape = (() => {
    type TargetType = GIT_PROVIDERS_EnvValue_ExpectedShape;

    const zProvider = z.object({
        type: z.enum(["gitlab", "forgejo", "github", "bitbucket"]),
        url: z.string().url(),
        displayName: z.string().trim().min(1).optional(),
        logoUrl: z
            .union([
                z.string().url(),
                z.object({ light: z.string().url(), dark: z.string().url() })
            ])
            .optional(),
        authentication: z.object({
            ui: z.union([
                z.object({ type: z.literal("oauth"), clientId: z.string().min(1) }),
                z.object({ type: z.literal("personal-access-token") })
            ]),
            service: z.union([
                z.object({ type: z.literal("personal-access-token") }),
                z.object({
                    type: z.literal("scoped-access-token"),
                    lifetimeDays: z.number().int().positive().optional()
                }),
                z.object({ type: z.literal("oauth"), clientId: z.string().min(1) })
            ])
        })
    });

    const zTargetType = z.object({
        description: zLocalizedString.optional(),
        providers: z.array(zProvider),
        disallowUserToAddProviders: z.boolean().optional()
    });

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();

/**
 * The `GIT_PROVIDERS` env. The integration is disabled when there is no provider and the
 * users can't add their own.
 */
export type GitProvidersConfig = {
    /** Markdown, written by the admin, introducing Git in the account tab */
    description: LocalizedString | undefined;
    providers: GitProvidersConfig.Provider[];
    /** The users can't add providers of their own (gitlab.com, github.com...) in Account > Git */
    disallowUserToAddProviders: boolean;
};

export namespace GitProvidersConfig {
    /** bitbucket: Bitbucket Cloud (bitbucket.org) only */
    export type ProviderType = "gitlab" | "forgejo" | "github" | "bitbucket";

    export type Provider = {
        /**
         * Not configurable: the displayName, "user:" followed by the url without its
         * scheme for the providers the users add themselves. Keys what is persisted
         * (tokens, sessions, launch markers), renaming a provider signs its users out.
         */
        id: string;
        type: ProviderType;
        /** Without trailing slash */
        url: string;
        /** Unique across the providers */
        displayName: string;
        /** undefined: the default logo of the type */
        logoUrl: ThemedAssetUrl | undefined;
        authentication: {
            ui: Authentication.Ui;
            service: Authentication.Service;
        };
    };

    export namespace Authentication {
        /** How Onyxia accesses the provider */
        export type Ui =
            | { type: "oauth"; clientId: string }
            | { type: "personal-access-token" };

        /** What the services get to clone and push */
        export type Service = Ui | { type: "scoped-access-token"; lifetimeDays: number };
    }
}

const DEFAULT_SCOPED_ACCESS_TOKEN_LIFETIME_DAYS = 30;

/** The ids of the providers the users add themselves in Account > Git start with it */
export const USER_PROVIDER_ID_PREFIX = "user:";

export function parseGitProvidersConfigFromEnvValue(params: {
    envValue: string;
}): GitProvidersConfig {
    const { envValue } = params;

    if (envValue.trim() === "") {
        return {
            description: undefined,
            providers: [],
            disallowUserToAddProviders: false
        };
    }

    let parsedValue: unknown;

    try {
        parsedValue = JSON5.parse(envValue);
    } catch {
        throw new Error("The GIT_PROVIDERS env is not a valid JSON5");
    }

    let config: GIT_PROVIDERS_EnvValue_ExpectedShape;

    try {
        config = zGIT_PROVIDERS_EnvValue_ExpectedShape.parse(parsedValue);
    } catch (error) {
        throw new Error(
            `The format of the GIT_PROVIDERS env is not valid: ${String(error)}`
        );
    }

    const providers = config.providers.map((provider): GitProvidersConfig.Provider => {
        const url = provider.url.replace(/\/+$/, "");
        const { host } = new URL(url);

        if (provider.type === "bitbucket" && !getIsBitbucketCloudUrl(url)) {
            throw new Error(
                `GIT_PROVIDERS env: ${url}, only Bitbucket Cloud (https://bitbucket.org) is supported`
            );
        }

        const { ui, service } = provider.authentication;

        {
            const reason = getUnsupportedCombinationReason({
                type: provider.type,
                ui: ui.type,
                service: service.type
            });

            if (reason !== undefined) {
                throw new Error(
                    `GIT_PROVIDERS env: ${url}, authentication ui "${ui.type}" with service "${service.type}" is not supported: ${reason}`
                );
            }
        }

        const displayName = provider.displayName ?? host;

        return {
            // NOTE: The url isn't unique, the same provider can be configured twice
            // (e.g. with a distinct authentication).
            id: displayName,
            type: provider.type,
            url,
            displayName,
            logoUrl: provider.logoUrl,
            authentication: {
                ui,
                service:
                    service.type === "scoped-access-token"
                        ? {
                              type: "scoped-access-token",
                              lifetimeDays:
                                  service.lifetimeDays ??
                                  DEFAULT_SCOPED_ACCESS_TOKEN_LIFETIME_DAYS
                          }
                        : service
            }
        };
    });

    {
        const provider_reservedId = providers.find(({ id }) =>
            id.startsWith(USER_PROVIDER_ID_PREFIX)
        );

        if (provider_reservedId !== undefined) {
            throw new Error(
                `GIT_PROVIDERS env: the displayName "${provider_reservedId.displayName}" starts with "${USER_PROVIDER_ID_PREFIX}", reserved for the providers the users add themselves`
            );
        }
    }

    {
        const ids = providers.map(({ id }) => id);
        const duplicateId = ids.find((id, index) => ids.indexOf(id) !== index);

        if (duplicateId !== undefined) {
            throw new Error(
                `GIT_PROVIDERS env: the displayName "${duplicateId}" is used by more than one provider, set a distinct displayName on each`
            );
        }
    }

    return {
        description: config.description,
        providers,
        disallowUserToAddProviders: config.disallowUserToAddProviders ?? false
    };
}

/**
 * What the OAuth session of a provider is stored under: the admin can change the url,
 * the type or the OAuth client and keep the displayName, the refresh token must not go
 * to the new one. The PATs are kept by id: renaming the provider is documented (.env).
 */
export function getProviderCredentialsKey(provider: GitProvidersConfig.Provider): string {
    const { ui } = provider.authentication;

    return JSON.stringify([
        provider.id,
        provider.type,
        provider.url,
        ui.type === "oauth" ? ui.clientId : ""
    ]);
}

/** The id of a provider the user added in Account > Git, see Provider.id */
export function getUserProviderId(params: { url: string }): string {
    const { url } = params;

    return `${USER_PROVIDER_ID_PREFIX}${url.replace(/^https?:\/\//, "")}`;
}

export function getIsBitbucketCloudUrl(url: string): boolean {
    return url.replace(/\/+$/, "") === "https://bitbucket.org";
}

/** undefined when the provider supports the combination */
function getUnsupportedCombinationReason(params: {
    type: GitProvidersConfig.ProviderType;
    ui: GitProvidersConfig.Authentication.Ui["type"];
    service: GitProvidersConfig.Authentication.Service["type"];
}): string | undefined {
    const { type, ui, service } = params;

    if (
        type === "bitbucket" &&
        (ui !== "personal-access-token" || service !== "personal-access-token")
    ) {
        return "Bitbucket's token endpoint requires the client secret, even for the refresh token, use an API token";
    }

    if (ui === "oauth" && type === "github") {
        return "GitHub's token endpoint requires a client secret and doesn't allow CORS, use a personal access token";
    }

    if (ui === "personal-access-token" && service !== "personal-access-token") {
        return "the personal access token the user creates is the one handed over to the services";
    }

    if (ui === "oauth" && service === "personal-access-token") {
        return "there is no personal access token to hand over to the services";
    }

    if (service === "scoped-access-token" && type !== "gitlab") {
        return "only GitLab lets Onyxia create access tokens";
    }

    return undefined;
}
