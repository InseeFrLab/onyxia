import type { UserApiClient, User } from "../ports/UserApiClient";
import { createDecodeJwtNoVerify } from "core/tools/decodeJwt/adapter/noVerify";
import { symToStr } from "tsafe/symToStr";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import { kcLanguageTags } from "keycloakify/lib/i18n/KcLanguageTag";
import { typeGuard } from "tsafe/typeGuard";
import type { KcLanguageTag } from "keycloakify";

export function createJwtUserApiClient(params: {
    jwtClaims: Record<keyof User, string>;
    getOidcAccessToken: () => Promise<string>;
}): UserApiClient {
    const { jwtClaims, getOidcAccessToken } = params;

    const { decodeJwt } = createDecodeJwtNoVerify({ jwtClaims });

    return {
        "getUser": async () => {
            const {
                groups: groupsStr,
                locale,
                email,
                familyName,
                firstName,
                username,
            } = await decodeJwt({
                "jwtToken": await getOidcAccessToken(),
            });

            const m = (reason: string) =>
                `The JWT token do not have the expected format: ${reason}`;

            let groups: string[] | undefined = undefined;

            assert(groupsStr !== undefined, m(`${symToStr({ groups })} missing`));

            try {
                groups = JSON.parse(groupsStr);
            } catch {
                assert(false, `${symToStr({ groups })} is not supposed to be a string`);
            }

            assert(
                groups instanceof Array &&
                    groups.find(group => typeof group !== "string") === undefined,
                m(`${symToStr({ groups })} is supposed to be an array of string`),
            );

            assert(locale !== undefined, m(`${symToStr({ locale })} missing`));
            assert(
                typeGuard<KcLanguageTag>(
                    locale,
                    id<readonly string[]>(kcLanguageTags).indexOf(locale) >= 0,
                ),
                m(`${symToStr({ locale })} must be one of: ${kcLanguageTags.join(", ")}`),
            );

            for (const [propertyName, propertyValue] of [
                [symToStr({ email }), email],
                [symToStr({ familyName }), familyName],
                [symToStr({ firstName }), firstName],
                [symToStr({ username }), username],
            ] as const) {
                assert(propertyValue !== undefined, m(`${propertyName} missing`));
                assert(
                    typeof propertyValue === "string",
                    m(`${propertyName} is supposed to be a string`),
                );
                assert(
                    propertyValue !== "",
                    m(`${propertyName} is supposed to be a non empty string`),
                );
            }

            return { groups, locale, email, familyName, firstName, username };
        },
    };
}
