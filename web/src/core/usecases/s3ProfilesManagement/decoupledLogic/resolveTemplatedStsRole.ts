import type { S3Config } from "core/ports/OnyxiaApi/S3Config";
import { id } from "tsafe/id";
import { z } from "zod";
import { getValueAtPath } from "core/tools/Stringifyable";

export type StsRole = {
    roleARN: string;
    roleSessionName: string;
    profileName: string;
};

export function resolveTemplatedStsRole(params: {
    stsRole_fromConfig: S3Config.Entry.StsRole.Templated;
    decodedIdToken: Record<string, unknown>;
}): StsRole[] {
    const { stsRole_fromConfig, decodedIdToken } = params;

    const { claimName, excludedClaimPattern, includedClaimPattern } = stsRole_fromConfig;

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

            return id<StsRole>({
                roleARN: substituteTemplateString(stsRole_fromConfig.roleARN),
                roleSessionName: substituteTemplateString(
                    stsRole_fromConfig.roleSessionName
                ),
                profileName: substituteTemplateString(stsRole_fromConfig.profileName)
            });
        })
        .filter(x => x !== undefined);
}
