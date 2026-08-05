import type { S3Config } from "core/ports/OnyxiaApi/S3Config";
import { id } from "tsafe/id";
import type { LocalizedString } from "ui/i18n";
import { z } from "zod";
import { getValueAtPath } from "core/tools/Stringifyable";
import { type S3Uri, parseS3Uri } from "core/tools/S3Uri";

export type ResolvedTemplateBookmark = {
    title: LocalizedString;
    s3Uri: S3Uri;
    forProfileNames: string[];
};

export async function resolveTemplatedBookmark(params: {
    bookmark_fromConfig: S3Config.Entry.Bookmark;
    getDecodedIdToken: () => Promise<Record<string, unknown>>;
}): Promise<ResolvedTemplateBookmark[]> {
    const { bookmark_fromConfig, getDecodedIdToken } = params;

    if (bookmark_fromConfig.claimName === undefined) {
        return [
            id<ResolvedTemplateBookmark>({
                s3Uri: parseS3Uri({
                    value: bookmark_fromConfig.s3UriStr_templated,
                    delimiter: "/"
                }),
                title: bookmark_fromConfig.title,
                forProfileNames: bookmark_fromConfig.forProfileNames
            })
        ];
    }

    const { claimName, excludedClaimPattern, includedClaimPattern } = bookmark_fromConfig;

    const decodedIdToken = await getDecodedIdToken();

    const claimValue_arr: string[] = (() => {
        let claimValue_untrusted: unknown = (() => {
            const candidate = decodedIdToken[claimName];

            if (candidate !== undefined) {
                return candidate;
            }

            const claimPath = claimName.split(".");

            if (claimPath.length === 1) {
                return undefined;
            }

            return getValueAtPath({
                // @ts-expect-error: We know decodedIdToken is Stringifyable
                stringifyableObjectOrArray: decodedIdToken,
                doDeleteFromSource: false,
                doFailOnUnresolved: false,
                path: claimPath
            });
        })();

        if (!claimValue_untrusted) {
            return [];
        }

        let claimValue: string | string[];

        try {
            claimValue = z
                .union([z.string(), z.array(z.string())])
                .parse(claimValue_untrusted);
        } catch (error) {
            throw new Error(
                [
                    `decodedIdToken -> ${claimName} is supposed to be`,
                    `string or array of string`,
                    `The decoded id token is:`,
                    JSON.stringify(decodedIdToken, null, 2)
                ].join(" "),
                { cause: error }
            );
        }

        return claimValue instanceof Array ? claimValue : [claimValue];
    })();

    const includedRegex =
        includedClaimPattern !== undefined ? new RegExp(includedClaimPattern) : /^(.+)$/;
    const excludedRegex =
        excludedClaimPattern !== undefined ? new RegExp(excludedClaimPattern) : undefined;

    return claimValue_arr
        .map(value => {
            if (excludedRegex !== undefined && excludedRegex.test(value)) {
                return undefined;
            }

            const match = includedRegex.exec(value);

            if (match === null) {
                return undefined;
            }

            const substituteTemplateString = (str: string) =>
                str.replace(/\$(\d+)/g, (_, i) => match[parseInt(i)] ?? "");

            const substituteLocalizedString = (
                locStr: LocalizedString
            ): LocalizedString => {
                if (typeof locStr === "string") {
                    return substituteTemplateString(locStr);
                }
                return Object.fromEntries(
                    Object.entries(locStr)
                        .filter(([, value]) => value !== undefined)
                        .map(([lang, value]) => [lang, substituteTemplateString(value)])
                );
            };

            return id<ResolvedTemplateBookmark>({
                s3Uri: parseS3Uri({
                    value: substituteTemplateString(
                        bookmark_fromConfig.s3UriStr_templated
                    ),
                    delimiter: "/"
                }),
                title: substituteLocalizedString(bookmark_fromConfig.title),
                forProfileNames: bookmark_fromConfig.forProfileNames.map(profileName =>
                    substituteTemplateString(profileName)
                )
            });
        })
        .filter(x => x !== undefined);
}
