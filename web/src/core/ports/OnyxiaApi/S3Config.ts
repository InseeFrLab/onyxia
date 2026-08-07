import type { ArrayOrNot } from "core/tools/ArrayOrNot";
import { type LocalizedString, zLocalizedString } from "core/ports/OnyxiaApi";
import type { OidcParams_Partial } from "./OidcParams";
import type { ApiTypes } from "core/adapters/onyxiaApi/ApiTypes";
import { z } from "zod";
import { assert, type Equals, id, is } from "tsafe";
import JSON5 from "json5";

type S3Config_S3_EnvValue_ExpectedShape = ArrayOrNot<{
    URL: string;
    pathStyleAccess?: boolean;

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
        oidcConfiguration?: Partial<ApiTypes.OidcConfiguration>;
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

const zS3Config_S3_EnvValue_ExpectedShape = (() => {
    type TargetType = S3Config_S3_EnvValue_ExpectedShape;

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
        issuerURI: z.string().optional(),
        clientID: z.string().optional(),
        extraQueryParams: z.string().optional(),
        scope: z.string().optional(),
        idleSessionLifetimeInSeconds: z.union([z.number(), z.string()]).optional()
    });

    const zOidcConfiguration = z.custom<Partial<ApiTypes.OidcConfiguration>>(
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
        pathStyleAccess: z.boolean().optional(),
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

export type S3Config = {
    entries: S3Config.Entry[];
    defaultValuesOfCreationForm:
        | Pick<S3Config.Entry, "url" | "pathStyleAccess" | "region">
        | undefined;
};

export namespace S3Config {
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

export function parseS3ConfigFromEnvValue(params: { envValue: string }): S3Config {
    const { envValue } = params;

    if (envValue === "") {
        return {
            entries: [],
            defaultValuesOfCreationForm: undefined
        };
    }

    let parsedValue: unknown;

    try {
        parsedValue = JSON5.parse(envValue);
    } catch {
        throw new Error(`The S3 env is not a valid JSON5`);
    }

    type ParsedValue = S3Config_S3_EnvValue_ExpectedShape;

    try {
        zS3Config_S3_EnvValue_ExpectedShape.parse(parsedValue);
    } catch (error) {
        throw new Error(`The format of the S3 env is not valid: ${String(error)}`);
    }
    assert(is<ParsedValue>(parsedValue));

    const parsedValue_arr = parsedValue instanceof Array ? parsedValue : [parsedValue];

    const entries = parsedValue_arr
        .filter(s3Config => s3Config.sts !== undefined)
        .map((s3Config): S3Config.Entry => {
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
                        (role): S3Config.Entry.StsRole => ({
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
                        issuerUri: sts.oidcConfiguration?.issuerURI || undefined,
                        clientId: sts.oidcConfiguration?.clientID || undefined,
                        extraQueryParams_raw:
                            sts.oidcConfiguration?.extraQueryParams || undefined,
                        scope_spaceSeparated: sts.oidcConfiguration?.scope || undefined,
                        idleSessionLifetimeInSeconds: (() => {
                            const value =
                                sts.oidcConfiguration?.idleSessionLifetimeInSeconds;

                            if (value === "" || value === undefined) {
                                return undefined;
                            }

                            if (typeof value === "number") {
                                return value;
                            }

                            return parseInt(value);
                        })()
                    }
                },
                bookmarks: (s3Config.bookmarks ?? []).map(
                    (bookmark): S3Config.Entry.Bookmark => ({
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
        parsedValue_arr.find(s3Config => s3Config.sts === undefined) ??
        parsedValue_arr[0];

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
