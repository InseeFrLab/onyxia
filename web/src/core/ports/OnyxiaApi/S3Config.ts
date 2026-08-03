import type { ArrayOrNot } from "core/tools/ArrayOrNot";
import { type LocalizedString, zLocalizedString } from "core/ports/OnyxiaApi";
import type { OidcParams_Partial } from "./OidcParams";
import { z } from "zod";
import { assert, type Equals, id } from "tsafe";

export type S3Config_UserProvided = ArrayOrNot<{
    URL: string;
    pathStyleAccess?: true;

    region?: string;
    sts?: {
        URL?: string;
        durationSeconds?: number;
        role: ArrayOrNot<
            {
                profileName: string;
                roleARN: string;
                roleSessionName: string;
            } & (
                | { claimName?: undefined }
                | {
                      claimName: string;
                      includedClaimPattern?: string;
                      excludedClaimPattern?: string;
                  }
            )
        >;
        oidcConfiguration?: OidcParams_Partial;
    };
    bookmarks?: ({
        s3Uri: string;
        title: LocalizedString;
        forProfileName?: string | string[];
    } & (
        | { claimName?: undefined }
        | {
              claimName: string;
              includedClaimPattern?: string;
              excludedClaimPattern?: string;
          }
    ))[];
}>;

export const zS3Config_UserProvided = (() => {
    type TargetType = S3Config_UserProvided;

    const zClaimFilter = z.union([
        z.object({
            claimName: z.undefined().optional()
        }),
        z.object({
            claimName: z.string(),
            includedClaimPattern: z.string().optional(),
            excludedClaimPattern: z.string().optional()
        })
    ]);

    const zOidcConfigurationShape = z.object({
        issuerUri: z.string().optional(),
        clientId: z.string().optional(),
        extraQueryParams_raw: z.string().optional(),
        scope_spaceSeparated: z.string().optional(),
        idleSessionLifetimeInSeconds: z.number().optional()
    });

    const zOidcConfiguration = z.custom<OidcParams_Partial>(
        value => zOidcConfigurationShape.safeParse(value).success
    );

    const zRole = z
        .object({
            profileName: z.string(),
            roleARN: z.string(),
            roleSessionName: z.string()
        })
        .and(zClaimFilter);

    const zBookmark = z
        .object({
            s3Uri: z.string(),
            title: zLocalizedString,
            forProfileName: z.union([z.string(), z.array(z.string())]).optional()
        })
        .and(zClaimFilter);

    const zS3Config = z.object({
        URL: z.string(),
        pathStyleAccess: z.literal(true).optional(),
        region: z.string().optional(),
        sts: z
            .object({
                URL: z.string().optional(),
                durationSeconds: z.number().optional(),
                role: z.union([zRole, z.array(zRole)]),
                oidcConfiguration: zOidcConfiguration.optional()
            })
            .optional(),
        bookmarks: z.array(zBookmark).optional()
    });

    const zTargetType = z.union([zS3Config, z.array(zS3Config)]);

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();

export type S3Config_Parsed = {
    entries: S3Config_Parsed.Entry[];
    defaultValuesOfCreationForm:
        | Pick<S3Config_Parsed.Entry, "url" | "pathStyleAccess" | "region">
        | undefined;
};

export namespace S3Config_Parsed {
    export type Entry = {
        url: string;
        pathStyleAccess: boolean;
        region: string | undefined;
        sts: {
            url: string | undefined;
            durationSeconds: number | undefined;
            roles: Entry.StsRole[];
            oidcParams: OidcParams_Partial;
        };
        bookmarks: Entry.Bookmark[];
    };

    export namespace Entry {
        export type StsRole = {
            roleARN: string;
            roleSessionName: string;
            profileName: string;
        } & (
            | {
                  claimName: undefined;
                  includedClaimPattern?: never;
                  excludedClaimPattern?: never;
              }
            | {
                  claimName: string;
                  includedClaimPattern: string | undefined;
                  excludedClaimPattern: string | undefined;
              }
        );

        export type Bookmark = {
            s3UriStr_templated: string;
            title: LocalizedString;
            forProfileNames: string[];
        } & (
            | {
                  claimName: undefined;
                  includedClaimPattern?: never;
                  excludedClaimPattern?: never;
              }
            | {
                  claimName: string;
                  includedClaimPattern: string | undefined;
                  excludedClaimPattern: string | undefined;
              }
        );
    }
}

export function s3Config_userProvidedToParsed(
    s3Config_userProvided: S3Config_UserProvided
): S3Config_Parsed {
    const s3Configs = Array.isArray(s3Config_userProvided)
        ? s3Config_userProvided
        : [s3Config_userProvided];

    const entries = s3Configs
        .filter(s3Config => s3Config.sts !== undefined)
        .map((s3Config): S3Config_Parsed.Entry => {
            const { sts } = s3Config;

            assert(sts !== undefined);

            const roles = Array.isArray(sts.role) ? sts.role : [sts.role];

            return {
                url: s3Config.URL,
                pathStyleAccess: s3Config.pathStyleAccess ?? true,
                region: s3Config.region,
                sts: {
                    url: sts.URL,
                    durationSeconds: sts.durationSeconds,
                    roles: roles.map(
                        (role): S3Config_Parsed.Entry.StsRole => ({
                            roleARN: role.roleARN,
                            roleSessionName: role.roleSessionName,
                            profileName: role.profileName,
                            ...(role.claimName === undefined
                                ? { claimName: undefined }
                                : {
                                      claimName: role.claimName,
                                      includedClaimPattern: role.includedClaimPattern,
                                      excludedClaimPattern: role.excludedClaimPattern
                                  })
                        })
                    ),
                    oidcParams: {
                        issuerUri: sts.oidcConfiguration?.issuerUri,
                        clientId: sts.oidcConfiguration?.clientId,
                        extraQueryParams_raw: sts.oidcConfiguration?.extraQueryParams_raw,
                        scope_spaceSeparated: sts.oidcConfiguration?.scope_spaceSeparated,
                        idleSessionLifetimeInSeconds:
                            sts.oidcConfiguration?.idleSessionLifetimeInSeconds
                    }
                },
                bookmarks: (s3Config.bookmarks ?? []).map(
                    (bookmark): S3Config_Parsed.Entry.Bookmark => ({
                        s3UriStr_templated: bookmark.s3Uri,
                        title: bookmark.title,
                        forProfileNames:
                            bookmark.forProfileName === undefined
                                ? []
                                : typeof bookmark.forProfileName === "string"
                                  ? [bookmark.forProfileName]
                                  : bookmark.forProfileName,
                        ...(bookmark.claimName === undefined
                            ? { claimName: undefined }
                            : {
                                  claimName: bookmark.claimName,
                                  includedClaimPattern: bookmark.includedClaimPattern,
                                  excludedClaimPattern: bookmark.excludedClaimPattern
                              })
                    })
                )
            };
        });

    const s3ConfigForCreationForm =
        s3Configs.find(s3Config => s3Config.sts === undefined) ?? s3Configs[0];

    return {
        entries,
        defaultValuesOfCreationForm:
            s3ConfigForCreationForm === undefined
                ? undefined
                : {
                      url: s3ConfigForCreationForm.URL,
                      pathStyleAccess: s3ConfigForCreationForm.pathStyleAccess ?? true,
                      region: s3ConfigForCreationForm.region
                  }
    };
}
