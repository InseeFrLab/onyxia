import { type LocalizedString, zLocalizedString } from "./Language";
import { z } from "zod";
import { assert, type Equals, id } from "tsafe";
import JSON5 from "json5";
import type { ThemedAssetUrl } from "onyxia-ui";

/**
 * JSON5 configuration accepted by the `GIT_FORGES` environment variable
 * (`gitForges` in the region configuration). Controls Account > Git and the
 * `git` launch context that charts use to clone and push from the services.
 *
 * Omitting it (an empty `GIT_FORGES`) enables the integration with no
 * admin-provided forge: users add their own. To disable it, use
 * `{ forges: [], disallowUserToAddForges: true }`.
 *
 * This configuration is exposed to the browser and must not contain secrets: the
 * OAuth applications are public clients, without secret.
 */
type GIT_FORGES_EnvValue_ExpectedShape = {
    /**
     * Markdown displayed below the "Git profiles" heading in Account > Git. Accepts
     * a string or translations such as `{ en: "...", fr: "..." }`. Omit to show the
     * default text.
     */
    description?: LocalizedString;
    /**
     * Forges provisioned by the administrator. Use `[]` to provision none.
     */
    forges: GIT_FORGES_EnvValue_ExpectedShape.Forge[];
    /**
     * Prevents users from adding their own forges (gitlab.com, github.com...)
     * with a personal access token.
     * @default false
     */
    disallowUserToAddForges?: boolean;
};

namespace GIT_FORGES_EnvValue_ExpectedShape {
    export type Forge = {
        /** `bitbucket` is Bitbucket Cloud only (`https://bitbucket.org`). */
        type: "gitlab" | "forgejo" | "github" | "bitbucket";
        /** Base URL of the forge, for example `https://gitlab.example.com`. */
        url: string;
        /**
         * Name displayed in Account > Git. Must be unique among the forges.
         *
         * Keep it stable: the user's tokens and sessions are saved under it, so
         * renaming a forge signs its users out.
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

const zGIT_FORGES_EnvValue_ExpectedShape = (() => {
    type TargetType = GIT_FORGES_EnvValue_ExpectedShape;

    const zForge = z.object({
        type: z.enum(["gitlab", "forgejo", "github", "bitbucket"]),
        url: z
            .string()
            .url()
            .refine(url => /^https?:\/\//i.test(url), "Must be an http(s) url"),
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
        forges: z.array(zForge),
        disallowUserToAddForges: z.boolean().optional()
    });

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();

/**
 * The `GIT_FORGES` env. The integration is disabled when there is no forge and the
 * users can't add their own.
 */
export type GitForgesConfig = {
    /** Markdown, written by the admin, introducing Git in the account tab */
    description: LocalizedString | undefined;
    forges: GitForgesConfig.Forge[];
    /** The users can't add forges of their own (gitlab.com, github.com...) in Account > Git */
    disallowUserToAddForges: boolean;
};

export namespace GitForgesConfig {
    /** bitbucket: Bitbucket Cloud (bitbucket.org) only */
    export type ForgeType = "gitlab" | "forgejo" | "github" | "bitbucket";

    export type Forge = {
        /**
         * Not configurable: the displayName, "user:" followed by the url without its
         * scheme for the forges the users add themselves. Keys what is persisted
         * (tokens, sessions, launch markers), renaming a forge signs its users out.
         */
        id: string;
        type: ForgeType;
        /** Without trailing slash */
        url: string;
        /** Unique across the forges */
        displayName: string;
        /** undefined: the default logo of the type */
        logoUrl: ThemedAssetUrl | undefined;
        authentication: {
            ui: Authentication.Ui;
            service: Authentication.Service;
        };
    };

    export namespace Authentication {
        /** How Onyxia accesses the forge */
        export type Ui =
            | { type: "oauth"; clientId: string }
            | { type: "personal-access-token" };

        /** What the services get to clone and push */
        export type Service = Ui | { type: "scoped-access-token"; lifetimeDays: number };
    }
}

const DEFAULT_SCOPED_ACCESS_TOKEN_LIFETIME_DAYS = 30;

/** The ids of the forges the users add themselves in Account > Git start with it */
export const USER_FORGE_ID_PREFIX = "user:";

export function parseGitForgesConfigFromEnvValue(params: {
    envValue: string;
}): GitForgesConfig {
    const { envValue } = params;

    if (envValue.trim() === "") {
        return {
            description: undefined,
            forges: [],
            disallowUserToAddForges: false
        };
    }

    let parsedValue: unknown;

    try {
        parsedValue = JSON5.parse(envValue);
    } catch {
        throw new Error("The GIT_FORGES env is not a valid JSON5");
    }

    let config: GIT_FORGES_EnvValue_ExpectedShape;

    try {
        config = zGIT_FORGES_EnvValue_ExpectedShape.parse(parsedValue);
    } catch (error) {
        throw new Error(
            `The format of the GIT_FORGES env is not valid: ${String(error)}`
        );
    }

    const forges = config.forges.map((forge): GitForgesConfig.Forge => {
        const url = forge.url.replace(/\/+$/, "");
        const { host } = new URL(url);

        if (forge.type === "bitbucket" && !getIsBitbucketCloudUrl(url)) {
            throw new Error(
                `GIT_FORGES env: ${url}, only Bitbucket Cloud (https://bitbucket.org) is supported`
            );
        }

        const { ui, service } = forge.authentication;

        {
            const reason = getUnsupportedCombinationReason({
                type: forge.type,
                ui: ui.type,
                service: service.type
            });

            if (reason !== undefined) {
                throw new Error(
                    `GIT_FORGES env: ${url}, authentication ui "${ui.type}" with service "${service.type}" is not supported: ${reason}`
                );
            }
        }

        const displayName = forge.displayName ?? host;

        return {
            // NOTE: The url isn't unique, the same forge can be configured twice
            // (e.g. with a distinct authentication).
            id: displayName,
            type: forge.type,
            url,
            displayName,
            logoUrl: forge.logoUrl,
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
        const forge_reservedId = forges.find(({ id }) =>
            id.startsWith(USER_FORGE_ID_PREFIX)
        );

        if (forge_reservedId !== undefined) {
            throw new Error(
                `GIT_FORGES env: the displayName "${forge_reservedId.displayName}" starts with "${USER_FORGE_ID_PREFIX}", reserved for the forges the users add themselves`
            );
        }
    }

    {
        const ids = forges.map(({ id }) => id);
        const duplicateId = ids.find((id, index) => ids.indexOf(id) !== index);

        if (duplicateId !== undefined) {
            throw new Error(
                `GIT_FORGES env: the displayName "${duplicateId}" is used by more than one forge, set a distinct displayName on each`
            );
        }
    }

    return {
        description: config.description,
        forges,
        disallowUserToAddForges: config.disallowUserToAddForges ?? false
    };
}

/**
 * What the OAuth session of a forge is stored under: the admin can change the url,
 * the type, the OAuth client or the service authentication and keep the displayName, the refresh token must not go
 * to the new one. The PATs are kept by id: renaming the forge is documented (.env).
 */
export function getForgeCredentialsKey(forge: GitForgesConfig.Forge): string {
    const { ui } = forge.authentication;

    return JSON.stringify([
        forge.id,
        forge.type,
        forge.url,
        ui.type === "oauth" ? ui.clientId : "",
        // NOTE: The ui OAuth scope depends on it (scoped-access-token needs api).
        forge.authentication.service.type
    ]);
}

/** The id of a forge the user added in Account > Git, see Forge.id */
export function getUserForgeId(params: { url: string }): string {
    const { url } = params;

    return `${USER_FORGE_ID_PREFIX}${url.replace(/^https?:\/\//, "")}`;
}

export function getIsBitbucketCloudUrl(url: string): boolean {
    return url.replace(/\/+$/, "") === "https://bitbucket.org";
}

/** undefined when the forge supports the combination */
function getUnsupportedCombinationReason(params: {
    type: GitForgesConfig.ForgeType;
    ui: GitForgesConfig.Authentication.Ui["type"];
    service: GitForgesConfig.Authentication.Service["type"];
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
