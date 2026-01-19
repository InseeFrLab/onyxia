import type { DeploymentRegion } from "core/ports/OnyxiaApi";
import { id } from "tsafe/id";
import { z } from "zod";
import { getValueAtPath } from "core/tools/Stringifyable";

export type ResolvedTemplateStsRole = {
    roleARN: string;
    roleSessionName: string;
    profileName: string;
};

export async function resolveTemplatedStsRole(params: {
    stsRole_region: DeploymentRegion.S3Next.S3Profile.StsRole;
    getDecodedIdToken: () => Promise<Record<string, unknown>>;
}): Promise<ResolvedTemplateStsRole[]> {
    const { stsRole_region, getDecodedIdToken } = params;

    if (stsRole_region.claimName === undefined) {
        return [
            id<ResolvedTemplateStsRole>({
                roleARN: stsRole_region.roleARN,
                roleSessionName: stsRole_region.roleSessionName,
                profileName: stsRole_region.profileName
            })
        ];
    }

    const { claimName, excludedClaimPattern, includedClaimPattern } = stsRole_region;

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

            return id<ResolvedTemplateStsRole>({
                roleARN: substituteTemplateString(stsRole_region.roleARN),
                roleSessionName: substituteTemplateString(stsRole_region.roleSessionName),
                profileName: substituteTemplateString(stsRole_region.profileName)
            });
        })
        .filter(x => x !== undefined);
}
