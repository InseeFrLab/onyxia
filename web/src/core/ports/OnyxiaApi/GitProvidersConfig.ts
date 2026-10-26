import { type LocalizedString, zLocalizedString } from "./Language";
import { z } from "zod";
import { assert, type Equals, id } from "tsafe";
import JSON5 from "json5";

type GIT_PROVIDERS_EnvValue_ExpectedShape = {
    description?: LocalizedString;
    providers: GIT_PROVIDERS_EnvValue_ExpectedShape.Provider[];
    disallowUserToAddProviders?: boolean;
};

namespace GIT_PROVIDERS_EnvValue_ExpectedShape {
    export type Provider = {
        type: GitProvidersConfig.ProviderType;
        url: string;
        /** Defaults to the host of the url */
        id?: string;
        /** Defaults to the host of the url */
        displayName?: string;
        logoUrl?: GitProvidersConfig.LogoUrl;
        documentation?: {
            mainText: LocalizedString;
            links?: GitProvidersConfig.Documentation.Link[];
        };
        authentication: {
            ui: GitProvidersConfig.Authentication.Ui;
            service:
                | { type: "personal-access-token" }
                | { type: "scoped-access-token"; lifetimeDays?: number }
                | { type: "oauth"; clientId: string };
        };
    };
}

const zGIT_PROVIDERS_EnvValue_ExpectedShape = (() => {
    type TargetType = GIT_PROVIDERS_EnvValue_ExpectedShape;

    const zProvider = z.object({
        type: z.enum(["gitlab", "forgejo", "github", "bitbucket"]),
        url: z.string().url(),
        id: z.string().trim().min(1).optional(),
        displayName: z.string().trim().min(1).optional(),
        logoUrl: z
            .union([
                z.string().url(),
                z.object({ light: z.string().url(), dark: z.string().url() })
            ])
            .optional(),
        documentation: z
            .object({
                mainText: zLocalizedString,
                links: z
                    .array(z.object({ label: zLocalizedString, url: z.string().url() }))
                    .optional()
            })
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
        /** Unique across the providers */
        id: string;
        type: ProviderType;
        /** Without trailing slash */
        url: string;
        displayName: string;
        /** undefined: the default logo of the type */
        logoUrl: LogoUrl | undefined;
        documentation: Documentation | undefined;
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
        export type Service =
            | { type: "personal-access-token" }
            | { type: "scoped-access-token"; lifetimeDays: number }
            /** clientId: an OAuth application distinct from Onyxia's */
            | { type: "oauth"; clientId: string };
    }

    export type Documentation = {
        mainText: LocalizedString;
        links: Documentation.Link[];
    };

    export namespace Documentation {
        export type Link = { label: LocalizedString; url: string };
    }

    export type LogoUrl = string | { light: string; dark: string };
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

    if (getIsPocFormat(parsedValue)) {
        throw new Error(
            [
                "The GIT_PROVIDERS env uses a format that is no longer supported:",
                "initScriptUrl is gone, and oauthClientId is replaced by",
                'authentication: { ui: { type: "oauth", clientId }, service: { ... } }.',
                "See the GIT_PROVIDERS entry of the .env file."
            ].join(" ")
        );
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

        return {
            id: provider.id ?? host,
            type: provider.type,
            url,
            displayName: provider.displayName ?? host,
            logoUrl: provider.logoUrl,
            documentation:
                provider.documentation === undefined
                    ? undefined
                    : {
                          mainText: provider.documentation.mainText,
                          links: provider.documentation.links ?? []
                      },
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
                `GIT_PROVIDERS env: the id "${provider_reservedId.id}" starts with "${USER_PROVIDER_ID_PREFIX}", reserved for the providers the users add themselves`
            );
        }
    }

    {
        const ids = providers.map(({ id }) => id);
        const duplicateId = ids.find((id, index) => ids.indexOf(id) !== index);

        if (duplicateId !== undefined) {
            throw new Error(
                `GIT_PROVIDERS env: the id "${duplicateId}" is used by more than one provider, set a distinct id on each`
            );
        }
    }

    return {
        description: config.description,
        providers,
        disallowUserToAddProviders: config.disallowUserToAddProviders ?? false
    };
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

    if (ui === "oauth" && service === "personal-access-token") {
        return "there is no personal access token to hand over to the services";
    }

    if (service === "scoped-access-token" && type !== "gitlab") {
        return "only GitLab lets Onyxia create access tokens";
    }

    return undefined;
}

/** The format of the proof of concept: `initScriptUrl`, `oauthClientId` per provider */
function getIsPocFormat(parsedValue: unknown): boolean {
    return z
        .object({
            initScriptUrl: z.unknown().optional(),
            providers: z.array(z.object({}).passthrough())
        })
        .refine(
            ({ initScriptUrl, providers }) =>
                initScriptUrl !== undefined ||
                providers.some(provider => "oauthClientId" in provider)
        )
        .safeParse(parsedValue).success;
}
