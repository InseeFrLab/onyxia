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
                                fullPath: substituteTemplateString({
                                    template: entry.fullPath,
                                    match
                                }),
                                title: substituteLocalizedString({
                                    localizedString: entry.title,
                                    match
                                }) as LocalizedString,
                                description: substituteLocalizedString({
                                    localizedString: entry.description,
                                    match
                                }),
                                tags: substituteLocalizedStringArray({
                                    array: entry.tags,
                                    match
                                })
                            })
                        ];
                    });
                })
            });
        })
    );

    return { resolvedAdminBookmarks };
}

function substituteTemplateString(params: {
    template: string;
    match: RegExpExecArray;
}): string {
    const { template, match } = params;
    return template.replace(/\$(\d+)/g, (_, i) => match[parseInt(i)] ?? "");
}

const substituteLocalizedStringArray = (params: {
    array: LocalizedString[] | undefined;
    match: RegExpExecArray;
}): LocalizedString[] | undefined => {
    const { array, match } = params;

    if (array === undefined) return undefined;

    return array.map(str =>
        substituteLocalizedString({
            localizedString: str,
            match
        })
    );
};

function substituteLocalizedString<T extends LocalizedString | undefined>(params: {
    localizedString: T;
    match: RegExpExecArray;
}): T {
    const { localizedString: input, match } = params;

    if (input === undefined) return undefined as T;

    if (typeof input === "string") {
        return substituteTemplateString({ template: input, match }) as T;
    }

    const result = Object.fromEntries(
        Object.entries(input).map(([lang, value]) => [
            lang,
            typeof value === "string"
                ? substituteTemplateString({ template: value, match })
                : value
        ])
    );

    return result as T;
}
