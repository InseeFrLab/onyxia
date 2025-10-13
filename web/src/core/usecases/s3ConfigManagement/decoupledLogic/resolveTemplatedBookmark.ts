import type { DeploymentRegion } from "core/ports/OnyxiaApi";
import { id } from "tsafe/id";
import type { LocalizedString } from "ui/i18n";
import type { S3Profile } from "./s3Profiles";
import { z } from "zod";
import { getValueAtPath } from "core/tools/Stringifyable";

export async function resolveTemplatedBookmark(params: {
    bookmark_region: DeploymentRegion.S3Config.Bookmark;
    getDecodedIdToken: () => Promise<Record<string, unknown>>;
}): Promise<S3Profile.Bookmark[]> {
    const { bookmark_region, getDecodedIdToken } = params;

    if (bookmark_region.claimName === undefined) {
        return [
            id<S3Profile.Bookmark>({
                title: bookmark_region.title,
                description: bookmark_region.description,
                tags: bookmark_region.tags,
                bucket: bookmark_region.bucket,
                keyPrefix: bookmark_region.keyPrefix
            })
        ];
    }

    const { claimName, excludedClaimPattern, includedClaimPattern } = bookmark_region;

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

            return id<S3Profile.Bookmark>({
                bucket: substituteTemplateString(bookmark_region.bucket),
                keyPrefix: substituteTemplateString(bookmark_region.keyPrefix),
                title: substituteLocalizedString(bookmark_region.title),
                description: substituteLocalizedString(bookmark_region.description),
                tags: bookmark_region.tags.map(tag => substituteLocalizedString(tag))
            });
        })
        .filter(x => x !== undefined);
}
