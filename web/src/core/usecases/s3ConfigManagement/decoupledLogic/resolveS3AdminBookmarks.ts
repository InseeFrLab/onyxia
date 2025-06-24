import type { DeploymentRegion, OidcParams_Partial } from "core/ports/OnyxiaApi";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import type { LocalizedString } from "ui/i18n";

export type DeploymentRegion_S3ConfigLike = {
    sts: {
        oidcParams: OidcParams_Partial;
    };
    bookmarkedDirectories: DeploymentRegion.S3Config.BookmarkedDirectory[];
};

assert<DeploymentRegion.S3Config extends DeploymentRegion_S3ConfigLike ? true : false>;

export type ResolvedAdminBookmark = {
    s3ConfigIndex: number;
    bookmarkedDirectories: DeploymentRegion.S3Config.BookmarkedDirectory.Common[];
};

export async function resolveS3AdminBookmarks(params: {
    deploymentRegion_s3Configs: DeploymentRegion_S3ConfigLike[];
    getDecodedIdToken: (params: {
        oidcParams_partial: OidcParams_Partial;
    }) => Promise<Record<string, unknown>>;
}): Promise<{
    resolvedAdminBookmarks: ResolvedAdminBookmark[];
}> {
    const { deploymentRegion_s3Configs, getDecodedIdToken } = params;

    const resolvedAdminBookmarks = await Promise.all(
        deploymentRegion_s3Configs.map(async (s3Config, i) => {
            const decodedIdToken = await getDecodedIdToken({
                oidcParams_partial: s3Config.sts.oidcParams
            });

            return id<ResolvedAdminBookmark>({
                s3ConfigIndex: i,
                bookmarkedDirectories: s3Config.bookmarkedDirectories.flatMap(entry => {
                    if (entry.claimName === undefined) {
                        return [
                            id<DeploymentRegion.S3Config.BookmarkedDirectory.Common>({
                                fullPath: entry.fullPath,
                                description: entry.description,
                                tags: entry.tags,
                                title: entry.title
                            })
                        ];
                    }

                    const { claimName, excludedClaimPattern, includedClaimPattern } =
                        entry;

                    const claimValue_arr: string[] = (() => {
                        const value = decodedIdToken[claimName];

                        if (!value) return [];

                        if (typeof value === "string") return [value];
                        if (Array.isArray(value)) return value.map(e => `${e}`);

                        assert(
                            false,
                            () =>
                                `${claimName} not in expected format! ${JSON.stringify(decodedIdToken)}`
                        );
                    })();

                    const includedRegex = includedClaimPattern
                        ? new RegExp(includedClaimPattern)
                        : undefined;
                    const excludedRegex = excludedClaimPattern
                        ? new RegExp(excludedClaimPattern)
                        : undefined;

                    return claimValue_arr.flatMap(value => {
                        if (excludedRegex !== undefined && excludedRegex.test(value))
                            return [];

                        if (includedRegex === undefined) {
                            return [];
                        }

                        const match = includedRegex.exec(value);

                        if (!match) {
                            return [];
                        }

                        return [
                            id<DeploymentRegion.S3Config.BookmarkedDirectory.Common>({
                                fullPath: substituteTemplate(
                                    entry.fullPath,
                                    match,
                                    value
                                ),
                                title: substituteLocalizedString(
                                    entry.title,
                                    match,
                                    value
                                ) as LocalizedString,
                                description: substituteLocalizedString(
                                    entry.description,
                                    match,
                                    value
                                ),
                                tags: substituteTemplateArray(entry.tags, match, value)
                            })
                        ];
                    });
                })
            });
        })
    );

    return { resolvedAdminBookmarks };
}

function substituteTemplate(
    template: string,
    match: RegExpExecArray,
    claimValue: string
): string {
    return template
        .replace(/\$(\d+)/g, (_, i) => match[parseInt(i)] ?? "")
        .replace(/\{\{claimValue\}\}/g, claimValue);
}

const substituteTemplateArray = (
    arr: string[] | undefined,
    match: RegExpExecArray,
    claimValue: string
): string[] | undefined => arr?.map(str => substituteTemplate(str, match, claimValue));

function substituteLocalizedString(
    input: LocalizedString | undefined,
    match: RegExpExecArray,
    claimValue: string
): LocalizedString | undefined {
    if (input === undefined) return undefined;

    if (typeof input === "string") {
        return substituteTemplate(input, match, claimValue);
    }

    return Object.entries(input).reduce(
        (acc, [lang, value]) =>
            typeof value === "string"
                ? { ...acc, [lang]: substituteTemplate(value, match, claimValue) }
                : acc,
        {}
    );
}
