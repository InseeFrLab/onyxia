/* In keycloak-theme, this should be evaluated early */

import { getSearchParam, addOrUpdateSearchParam } from "powerhooks/tools/urlSearchParams";
import { updateSearchBarUrl } from "powerhooks/tools/updateSearchBar";
import { assert, type Equals, is } from "tsafe/assert";
import { isAmong } from "tsafe/isAmong";
import { kcEnvNames } from "keycloak-theme/kc.gen";
import { typeGuard } from "tsafe/typeGuard";
import { id } from "tsafe/id";
import { objectKeys } from "tsafe/objectKeys";
import type { PaletteBase } from "onyxia-ui";
import type { DeepPartial } from "keycloakify/tools/DeepPartial";
import { parseThemedAssetUrl, zAssetVariantUrl } from "ui/shared/parseThemedAssetUrl";
import type { ThemedAssetUrl } from "onyxia-ui";
import type { Language, LocalizedString } from "ui/i18n";
import memoize from "memoizee";
import { z } from "zod";
import { removeDuplicates } from "evt/tools/reducers/removeDuplicates";
import { zLocalizedString, zLanguage, languages } from "ui/i18n/z";
import { type LinkFromConfig, zLinkFromConfig } from "ui/shared/LinkFromConfig";
import dragoonSvgUrl from "ui/assets/svg/Dragoon.svg";
import { parseCssSpacing } from "ui/tools/parseCssSpacing";
import onyxiaNeumorphismDarkModeUrl from "ui/assets/svg/OnyxiaNeumorphismDarkMode.svg";
import onyxiaNeumorphismLightModeUrl from "ui/assets/svg/OnyxiaNeumorphismLightMode.svg";
import { getIsJSON5ObjectOrArray } from "ui/tools/getIsJSON5ObjectOrArray";
import JSON5 from "json5";
import { ensureUrlIsSafe } from "ui/shared/ensureUrlIsSafe";

//NOTE: Initially we where in CRA so we used PUBLIC_URL,
// in Vite BASE_URL is the equivalent but it's not exactly formatted the same way.
// CRA: "" <=> Vite: "/"
// CRA: "/foo" <=> Vite: "/foo/"
// So we convert the Vite format to the CRA format for retro compatibility.
export const PUBLIC_URL = (() => {
    const BASE_URL = import.meta.env.BASE_URL;

    return BASE_URL === "/" ? "" : BASE_URL.replace(/\/$/, "");
})();

export const { env, injectEnvsTransferableToKeycloakTheme } = createParsedEnvs([
    {
        envName: "ONYXIA_API_URL",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue }) => {
            assert(envValue !== "", "Should have default in .env");

            return envValue;
        }
    },
    {
        envName: "HEADER_LOGO",
        isUsedInKeycloakTheme: true,
        validateAndParseOrGetDefault: ({ envValue, envName }): ThemedAssetUrl => {
            assert(envValue !== "", "Should have default in .env");

            let parsedValue: ThemedAssetUrl;

            try {
                parsedValue = parseThemedAssetUrl(envValue);
            } catch (error) {
                throw new Error(`${envName} is malformed. ${String(error)}`);
            }

            return parsedValue;
        }
    },
    {
        envName: "PALETTE_OVERRIDE",
        isUsedInKeycloakTheme: true,
        validateAndParseOrGetDefault: ({
            envValue,
            envName
        }): DeepPartial<PaletteBase> => {
            if (envValue === "") {
                return {};
            }

            let paletteOverride: any;

            try {
                paletteOverride = JSON5.parse(envValue);
            } catch (err) {
                throw new Error(`${envName} is not parsable JSON5: ${envValue}`);
            }

            assert(
                typeGuard<DeepPartial<PaletteBase>>(
                    paletteOverride,
                    typeof paletteOverride === "object" &&
                        paletteOverride !== null &&
                        !(paletteOverride instanceof Array)
                ),
                `${envName} should be a JSON object`
            );

            return paletteOverride;
        }
    },
    {
        envName: "PALETTE_OVERRIDE_LIGHT",
        isUsedInKeycloakTheme: true,
        validateAndParseOrGetDefault: ({
            envValue,
            envName
        }): DeepPartial<PaletteBase> => {
            if (envValue === "") {
                return {};
            }

            let paletteOverride: any;

            try {
                paletteOverride = JSON5.parse(envValue);
            } catch (err) {
                throw new Error(`${envName} is not parsable JSON5: ${envValue}`);
            }

            assert(
                typeGuard<DeepPartial<PaletteBase>>(
                    paletteOverride,
                    typeof paletteOverride === "object" &&
                        paletteOverride !== null &&
                        !(paletteOverride instanceof Array)
                ),
                `${envName} should be a JSON object`
            );

            return paletteOverride;
        }
    },
    {
        envName: "PALETTE_OVERRIDE_DARK",
        isUsedInKeycloakTheme: true,
        validateAndParseOrGetDefault: ({
            envValue,
            envName
        }): DeepPartial<PaletteBase> => {
            if (envValue === "") {
                return {};
            }

            let paletteOverride: any;

            try {
                paletteOverride = JSON5.parse(envValue);
            } catch (err) {
                throw new Error(`${envName} is not parsable JSON5: ${envValue}`);
            }

            assert(
                typeGuard<DeepPartial<PaletteBase>>(
                    paletteOverride,
                    typeof paletteOverride === "object" &&
                        paletteOverride !== null &&
                        !(paletteOverride instanceof Array)
                ),
                `${envName} should be a JSON object`
            );

            return paletteOverride;
        }
    },
    {
        envName: "SPLASHSCREEN_LOGO",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({
            envValue,
            envName,
            env: env_
        }): ThemedAssetUrl => {
            if (envValue === "") {
                assert(is<typeof env>(env_));

                return env_.HEADER_LOGO;
            }

            let parsedValue: ThemedAssetUrl;

            try {
                parsedValue = parseThemedAssetUrl(envValue);
            } catch (error) {
                throw new Error(`${envName} is malformed. ${String(error)}`);
            }

            return parsedValue;
        }
    },
    {
        envName: "SPLASHSCREEN_LOGO_SCALE_FACTOR",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            assert(envValue !== "", "Should have default in .env");

            const parsedValue = Number(envValue);

            assert(!isNaN(parsedValue), `${envName} is not a number`);

            return parsedValue;
        }
    },

    {
        envName: "HEADER_TEXT_BOLD",
        isUsedInKeycloakTheme: true,
        validateAndParseOrGetDefault: ({ envValue }) => {
            if (envValue === "") {
                return undefined;
            }
            return envValue;
        }
    },
    {
        envName: "HEADER_TEXT_FOCUS",
        isUsedInKeycloakTheme: true,
        validateAndParseOrGetDefault: ({ envValue }) => {
            assert(envValue !== "", "Should have default in .env");
            return envValue;
        }
    },
    {
        envName: "TAB_TITLE",
        isUsedInKeycloakTheme: true,
        validateAndParseOrGetDefault: ({ envValue }) => {
            assert(envValue !== "", "Should have default in .env");

            function sanitizeTitle(title: string) {
                // Basic sanitization: remove script tags, encode special characters, etc.
                return title.replace(/<\/?script[^>]*>/gi, "").replace(
                    /[<>]/g,
                    char =>
                        ({
                            "<": "&lt;",
                            ">": "&gt;"
                        })[char]!
                );
            }

            return sanitizeTitle(envValue);
        }
    },
    {
        envName: "TERMS_OF_SERVICES",
        isUsedInKeycloakTheme: true,
        validateAndParseOrGetDefault: ({
            envValue,
            envName
        }): Partial<Record<Language, string>> | string | undefined => {
            if (envValue === "") {
                return undefined;
            }

            if (!getIsJSON5ObjectOrArray(envValue)) {
                ensureUrlIsSafe(envValue);
                return envValue;
            }

            let tosUrlByLng: Partial<Record<Language, string>>;

            try {
                tosUrlByLng = JSON5.parse(envValue);
            } catch {
                throw new Error(`${envName} malformed`);
            }

            {
                const languages = objectKeys(tosUrlByLng);

                languages.forEach(lang =>
                    assert(
                        id<readonly string[]>(languages).includes(lang),
                        `${lang} is not a supported languages, supported languages are: ${languages.join(
                            ", "
                        )}`
                    )
                );

                languages.forEach(lang =>
                    assert(
                        typeof tosUrlByLng[lang] === "string",
                        `terms of service malformed (${lang})`
                    )
                );
            }

            if (Object.keys(tosUrlByLng).length === 0) {
                return undefined;
            }

            Object.values(tosUrlByLng).forEach(url => {
                ensureUrlIsSafe(url);
            });

            return tosUrlByLng;
        }
    },
    {
        envName: "FAVICON",
        isUsedInKeycloakTheme: true,
        validateAndParseOrGetDefault: ({
            envValue,
            envName,
            env: env_
        }): ThemedAssetUrl => {
            if (envValue === "") {
                assert(is<typeof env>(env_));

                return env_.HEADER_LOGO;
            }

            let parsedValue: ThemedAssetUrl;

            try {
                parsedValue = parseThemedAssetUrl(envValue);
            } catch (error) {
                throw new Error(`${envName} is malformed. ${String(error)}`);
            }

            return parsedValue;
        }
    },
    {
        envName: "FONT",
        isUsedInKeycloakTheme: true,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            assert(envValue !== "Should have default in .env");

            let parsedValue: unknown;

            try {
                parsedValue = JSON5.parse(envValue);
            } catch {
                throw new Error(`${envName} is not a valid JSON`);
            }

            type ParsedValue = {
                fontFamily: string;
                dirUrl: string;
                400: string;
                ["400-italic"]?: string;
                500?: string;
                ["500-italic"]?: string;
                600?: string;
                ["600-italic"]?: string;
                700?: string;
                ["700-italic"]?: string;
            };

            const zParsedValue = z.object({
                fontFamily: z.string(),
                dirUrl: z.string(),
                "400": z.string(),
                "400-italic": z.string().optional(),
                "500": z.string().optional(),
                "500-italic": z.string().optional(),
                "600": z.string().optional(),
                "600-italic": z.string().optional(),
                "700": z.string().optional(),
                "700-italic": z.string().optional()
            });

            {
                type Got = ReturnType<(typeof zParsedValue)["parse"]>;
                type Expected = ParsedValue;

                assert<Equals<Expected, Got>>();
            }

            try {
                zParsedValue.parse(parsedValue);
            } catch (error) {
                throw new Error(
                    `The format of ${envName} is not valid: ${String(error)}`
                );
            }
            assert(is<ParsedValue>(parsedValue));

            parsedValue.fontFamily = parsedValue.fontFamily.replace(
                /[^a-zA-Z0-9 \-áéíóúÁÉÍÓÚäëïöüÄËÏÖÜ]/g,
                ""
            );

            {
                const { fontFamily, dirUrl, ...rest } = parsedValue;

                Object.values(rest).forEach(fontFileBasename =>
                    ensureUrlIsSafe(`${dirUrl}/${fontFileBasename}`)
                );
            }

            return parsedValue;
        }
    },
    {
        envName: "LEFTBAR_LINKS",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }): LinkFromConfig[] => {
            if (envValue === "") {
                return [];
            }

            let parsedValue: unknown;

            try {
                parsedValue = JSON5.parse(envValue);
            } catch {
                throw new Error(`${envName} is not a valid JSON`);
            }

            type ParsedValue = LinkFromConfig[];

            const zParsedValue = z.array(
                zLinkFromConfig.superRefine((data, ctx) => {
                    if (data.endIcon !== undefined) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: `You can specify endIcons in ${envName}, see: ${JSON.stringify(
                                data
                            )}`
                        });
                    }

                    if (data.startIcon === undefined && data.icon === undefined) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: `You must chose an icon for ${JSON.stringify(data)}`
                        });
                    }
                })
            );

            {
                type Got = ReturnType<(typeof zParsedValue)["parse"]>;
                type Expected = ParsedValue;

                // NOTE: Here the assert<Equals<>> type assertion is too strict so we
                // test double inclusion // to ensure that the types are the same.
                assert<Got extends Expected ? true : false>();
                assert<Expected extends Got ? true : false>();
            }

            try {
                zParsedValue.parse(parsedValue);
            } catch (error) {
                throw new Error(
                    `The format of ${envName} is not valid: ${String(error)}`
                );
            }
            assert(is<ParsedValue>(parsedValue));

            return parsedValue;
        }
    },
    {
        envName: "HEADER_LINKS",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            if (envValue === "") {
                return [];
            }

            let parsedValue: unknown;

            try {
                parsedValue = JSON5.parse(envValue);
            } catch {
                throw new Error(`${envName} is not a valid JSON`);
            }

            type ParsedValue = LinkFromConfig[];

            const zParsedValue = z.array(
                zLinkFromConfig.superRefine((data, ctx) => {
                    if (data.endIcon !== undefined) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: `You can specify endIcons in ${envName}, see: ${JSON.stringify(
                                data
                            )}`
                        });
                    }

                    if (data.startIcon === undefined && data.icon === undefined) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: `You must chose an icon for ${JSON.stringify(data)}`
                        });
                    }
                })
            );

            {
                type Got = ReturnType<(typeof zParsedValue)["parse"]>;
                type Expected = ParsedValue;

                assert<Got extends Expected ? true : false>();
                assert<Expected extends Got ? true : false>();
            }

            try {
                zParsedValue.parse(parsedValue);
            } catch (error) {
                throw new Error(
                    `The format of ${envName} is not valid: ${String(error)}`
                );
            }
            assert(is<ParsedValue>(parsedValue));

            return parsedValue;
        }
    },
    {
        envName: "FOOTER_LINKS",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            if (envValue === "") {
                return [];
            }

            let parsedValue: unknown;

            try {
                parsedValue = JSON5.parse(envValue);
            } catch {
                throw new Error(`${envName} is not a valid JSON`);
            }

            type ParsedValue = LinkFromConfig[];

            const zParsedValue = z.array(
                zLinkFromConfig.superRefine((data, ctx) => {
                    if (data.endIcon !== undefined) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: `You can specify endIcons in ${envName}, see: ${JSON.stringify(
                                data
                            )}`
                        });
                    }
                })
            );

            {
                type Got = ReturnType<(typeof zParsedValue)["parse"]>;
                type Expected = ParsedValue;

                assert<Got extends Expected ? true : false>();
                assert<Expected extends Got ? true : false>();
            }

            try {
                zParsedValue.parse(parsedValue);
            } catch (error) {
                throw new Error(
                    `The format of ${envName} is not valid: ${String(error)}`
                );
            }
            assert(is<ParsedValue>(parsedValue));

            return parsedValue;
        }
    },
    {
        envName: "DISABLE_HOMEPAGE",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `${envName} should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    },
    {
        envName: "HOMEPAGE_LOGO",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({
            envValue,
            envName,
            env: env_
        }): ThemedAssetUrl | undefined => {
            if (envValue === "") {
                assert(is<typeof env>(env_));

                return env_.HEADER_LOGO;
            }

            if (envValue === "false") {
                return undefined;
            }

            let parsedValue: ThemedAssetUrl;

            try {
                parsedValue = parseThemedAssetUrl(envValue);
            } catch (error) {
                throw new Error(`${envName} is malformed. ${String(error)}`);
            }

            return parsedValue;
        }
    },
    {
        envName: "HOMEPAGE_MAIN_ASSET",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({
            envValue,
            envName
        }): ThemedAssetUrl | undefined => {
            if (envValue === "") {
                return dragoonSvgUrl;
            }

            if (envValue === "false") {
                return undefined;
            }

            let parsedValue: ThemedAssetUrl;

            try {
                parsedValue = parseThemedAssetUrl(envValue);
            } catch (error) {
                throw new Error(`${envName} is malformed. ${String(error)}`);
            }

            return parsedValue;
        }
    },
    {
        envName: "HOMEPAGE_MAIN_ASSET_X_OFFSET",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            assert(envValue !== "", "Should have default in .env");

            try {
                return parseCssSpacing(envValue);
            } catch (error) {
                throw new Error(`${envName} is malformed. ${String(error)}`);
            }
        }
    },
    {
        envName: "HOMEPAGE_MAIN_ASSET_Y_OFFSET",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            assert(envValue !== "Should have default in .env");

            try {
                return parseCssSpacing(envValue);
            } catch (error) {
                throw new Error(`${envName} is malformed. ${String(error)}`);
            }
        }
    },
    {
        envName: "HOMEPAGE_MAIN_ASSET_SCALE_FACTOR",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            assert(envValue !== "", "Should have default in .env");

            const parsedValue = Number(envValue);

            assert(!isNaN(parsedValue), `${envName} is not a number`);

            return parsedValue;
        }
    },
    {
        envName: "HOMEPAGE_HERO_TEXT",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({
            envValue,
            envName
        }): LocalizedString | undefined => {
            if (envValue === "") {
                return undefined;
            }

            if (!getIsJSON5ObjectOrArray(envValue)) {
                return envValue;
            }

            let parsedValue: unknown;

            try {
                parsedValue = JSON5.parse(envValue);
            } catch {
                throw new Error(`${envName} is not a valid JSON`);
            }

            try {
                zLocalizedString.parse(parsedValue);
            } catch (error) {
                throw new Error(
                    `The format of ${envName} is not valid: ${String(error)}`
                );
            }
            assert(is<LocalizedString>(parsedValue));

            return parsedValue;
        }
    },
    {
        envName: "HOMEPAGE_HERO_TEXT_AUTHENTICATED",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({
            envValue,
            envName,
            env: env_
        }): ((params: { userFirstname: string }) => LocalizedString) | undefined => {
            const toFn =
                (localizedString: LocalizedString) =>
                (params: { userFirstname: string }): LocalizedString => {
                    const { userFirstname } = params;

                    return JSON5.parse(
                        JSON.stringify(localizedString).replace(
                            /%USER_FIRSTNAME%/g,
                            userFirstname
                        )
                    );
                };

            if (envValue === "") {
                assert(is<typeof env>(env_));

                return env_.HOMEPAGE_HERO_TEXT === undefined
                    ? undefined
                    : toFn(env_.HOMEPAGE_HERO_TEXT);
            }

            if (!getIsJSON5ObjectOrArray(envValue)) {
                return toFn(envValue);
            }

            let parsedValue: unknown;

            try {
                parsedValue = JSON5.parse(envValue);
            } catch {
                throw new Error(`${envName} is not a valid JSON`);
            }

            try {
                zLocalizedString.parse(parsedValue);
            } catch (error) {
                throw new Error(
                    `The format of ${envName} is not valid: ${String(error)}`
                );
            }
            assert(is<LocalizedString>(parsedValue));

            return toFn(parsedValue);
        }
    },
    {
        envName: "HOMEPAGE_BELOW_HERO_TEXT",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({
            envValue,
            envName
        }): LocalizedString | undefined => {
            if (envValue === "") {
                return undefined;
            }

            if (!getIsJSON5ObjectOrArray(envValue)) {
                return envValue;
            }

            let parsedValue: unknown;

            try {
                parsedValue = JSON5.parse(envValue);
            } catch {
                throw new Error(`${envName} is not a valid JSON`);
            }

            try {
                zLocalizedString.parse(parsedValue);
            } catch (error) {
                throw new Error(
                    `The format of ${envName} is not valid: ${String(error)}`
                );
            }
            assert(is<LocalizedString>(parsedValue));

            return parsedValue;
        }
    },
    {
        envName: "HOMEPAGE_BELOW_HERO_TEXT_AUTHENTICATED",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({
            envValue,
            envName,
            env: env_
        }): ((params: { userFirstname: string }) => LocalizedString) | undefined => {
            const toFn =
                (localizedString: LocalizedString) =>
                (params: { userFirstname: string }): LocalizedString => {
                    const { userFirstname } = params;

                    return JSON5.parse(
                        JSON.stringify(localizedString).replace(
                            /%USER_FIRSTNAME%/g,
                            userFirstname
                        )
                    );
                };

            if (envValue === "") {
                assert(is<typeof env>(env_));

                return env_.HOMEPAGE_BELOW_HERO_TEXT === undefined
                    ? undefined
                    : toFn(env_.HOMEPAGE_BELOW_HERO_TEXT);
            }

            if (!getIsJSON5ObjectOrArray(envValue)) {
                return toFn(envValue);
            }

            let parsedValue: unknown;

            try {
                parsedValue = JSON5.parse(envValue);
            } catch {
                throw new Error(`${envName} is not a valid JSON`);
            }

            try {
                zLocalizedString.parse(parsedValue);
            } catch (error) {
                throw new Error(
                    `The format of ${envName} is not valid: ${String(error)}`
                );
            }
            assert(is<LocalizedString>(parsedValue));

            return toFn(parsedValue);
        }
    },
    {
        envName: "HOMEPAGE_CALL_TO_ACTION_BUTTON",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({
            envValue,
            envName
        }): LinkFromConfig | undefined | null => {
            if (envValue === "") {
                return undefined;
            }

            if (envValue === "false") {
                return null;
            }

            let parsedValue: unknown;

            try {
                parsedValue = JSON5.parse(envValue);
            } catch {
                throw new Error(`${envName} is not a valid JSON`);
            }

            type ParsedValue = LinkFromConfig;

            const zParsedValue = zLinkFromConfig;

            try {
                zParsedValue.parse(parsedValue);
            } catch (error) {
                throw new Error(
                    `The format of ${envName} is not valid: ${String(error)}`
                );
            }
            assert(is<ParsedValue>(parsedValue));

            return parsedValue;
        }
    },
    {
        envName: "HOMEPAGE_CALL_TO_ACTION_BUTTON_AUTHENTICATED",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({
            envValue,
            envName,
            env: env_
        }): LinkFromConfig | undefined | null => {
            if (envValue === "") {
                assert(is<typeof env>(env_));

                return env_.HOMEPAGE_CALL_TO_ACTION_BUTTON;
            }

            if (envValue === "false") {
                return null;
            }

            let parsedValue: unknown;

            try {
                parsedValue = JSON5.parse(envValue);
            } catch {
                throw new Error(`${envName} is not a valid JSON`);
            }

            type ParsedValue = LinkFromConfig;

            const zParsedValue = zLinkFromConfig;

            try {
                zParsedValue.parse(parsedValue);
            } catch (error) {
                throw new Error(
                    `The format of ${envName} is not valid: ${String(error)}`
                );
            }
            assert(is<ParsedValue>(parsedValue));

            return parsedValue;
        }
    },
    {
        envName: "HOMEPAGE_CARDS",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            if (envValue === "") {
                return undefined;
            }

            let parsedValue: unknown;

            try {
                parsedValue = JSON5.parse(envValue);
            } catch {
                throw new Error(`${envName} is not a valid JSON`);
            }

            type ParsedValue = {
                pictogram: ThemedAssetUrl;
                title: LocalizedString;
                description: LocalizedString;
                button: LinkFromConfig;
            }[];

            const zParsedValue = z.array(
                z.object({
                    pictogram: zAssetVariantUrl,
                    title: zLocalizedString,
                    description: zLocalizedString,
                    button: zLinkFromConfig
                })
            );

            {
                type Got = ReturnType<(typeof zParsedValue)["parse"]>;
                type Expected = ParsedValue;

                assert<Got extends Expected ? true : false>();
                assert<Expected extends Got ? true : false>();
            }

            try {
                zParsedValue.parse(parsedValue);
            } catch (error) {
                throw new Error(
                    `The format of ${envName} is not valid: ${String(error)}`
                );
            }
            assert(is<ParsedValue>(parsedValue));

            return parsedValue;
        }
    },
    {
        envName: "BACKGROUND_ASSET",
        isUsedInKeycloakTheme: true,
        validateAndParseOrGetDefault: ({
            envValue,
            envName
        }): ThemedAssetUrl | undefined => {
            if (envValue === "false") {
                return undefined;
            }

            if (envValue === "") {
                return {
                    dark: onyxiaNeumorphismDarkModeUrl,
                    light: onyxiaNeumorphismLightModeUrl
                };
            }

            let parsedValue: ThemedAssetUrl;

            try {
                parsedValue = parseThemedAssetUrl(envValue);
            } catch (error) {
                throw new Error(`${envName} is malformed. ${String(error)}`);
            }

            return parsedValue;
        }
    },
    {
        envName: "DISABLE_AUTO_LAUNCH",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `${envName} should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    },
    {
        envName: "AUTHENTICATION_GLOBALLY_REQUIRED",
        isUsedInKeycloakTheme: true,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `${envName} should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    },
    {
        envName: "HEADER_HIDE_ONYXIA",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `${envName} should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    },
    {
        envName: "GLOBAL_ALERT",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            if (envValue === "") {
                return undefined;
            }

            type ParsedValue = {
                severity: "error" | "warning" | "info" | "success";
                message: LocalizedString;
            };

            if (!getIsJSON5ObjectOrArray(envValue)) {
                return id<ParsedValue>({
                    severity: "info" as const,
                    message: envValue
                });
            }

            let parsedValue: unknown;

            try {
                parsedValue = JSON5.parse(envValue);
            } catch {
                throw new Error(`${envName} is not a valid JSON`);
            }

            if (
                parsedValue !== null &&
                typeof parsedValue === "object" &&
                !("severity" in parsedValue)
            ) {
                try {
                    zLocalizedString.parse(parsedValue);
                } catch (error) {
                    throw new Error(
                        `The format of ${envName} is not valid: ${String(error)}`
                    );
                }
                assert(is<LocalizedString>(parsedValue));

                return id<ParsedValue>({
                    severity: "info" as const,
                    message: parsedValue
                });
            }

            const zParsedValue = z.object({
                severity: z.enum(["error", "warning", "info", "success"]),
                message: zLocalizedString
            });

            {
                type Got = ReturnType<(typeof zParsedValue)["parse"]>;
                type Expected = ParsedValue;

                assert<Got extends Expected ? true : false>();
                assert<Expected extends Got ? true : false>();
            }

            try {
                zParsedValue.parse(parsedValue);
            } catch (error) {
                throw new Error(
                    `The format of ${envName} is not valid: ${String(error)}`
                );
            }
            assert(is<ParsedValue>(parsedValue));

            return parsedValue;
        }
    },
    {
        envName: "DISABLE_PERSONAL_INFOS_INJECTION_IN_GROUP",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `${envName} should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    },
    {
        envName: "DISABLE_COMMAND_BAR",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `${envName} should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    },
    {
        envName: "ENABLED_LANGUAGES",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue }): readonly Language[] => {
            try {
                if (envValue === "") {
                    return languages;
                }

                return envValue
                    .split(",")
                    .map(part => part.trim())
                    .reduce(...removeDuplicates<string>())
                    .map(language => {
                        try {
                            return zLanguage.parse(language);
                        } catch {
                            throw new Error(
                                `Language ${language} not supported by Onyxia. Supported languages are ${languages.join(
                                    ", "
                                )}`
                            );
                        }
                    });
            } catch (error) {
                throw new Error(
                    JSON.stringify(import.meta.env.MODE) + " " + String(error)
                );
            }
        }
    },
    {
        envName: "ONYXIA_VERSION",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue }) =>
            envValue === "" ? undefined : envValue
    },
    {
        envName: "ONYXIA_VERSION_URL",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue }) =>
            envValue === "" ? undefined : envValue
    },
    {
        envName: "SAMPLE_DATASET_URL",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue }) => {
            assert(envValue !== "", "Should have default in .env");
            return envValue;
        }
    },
    {
        envName: "SAMPLE_DATACOLLECTION_URL",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue }) => {
            assert(envValue !== "", "Should have default in .env");
            return envValue;
        }
    },

    {
        envName: "QUOTA_WARNING_THRESHOLD",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            const n = Number.parseFloat(envValue.trim().replace(/%$/, ""));

            if (isNaN(n)) {
                throw new Error(
                    `${envName} is not well formatted it should be "75%" or "75" or "0.75"`
                );
            }

            if (n <= 1) {
                return n;
            }

            assert(n <= 100, `${envName} ${envValue} is not a valid percentage`);

            return n / 100;
        }
    },
    {
        envName: "RUNNING_TIME_THRESHOLD_HOURS",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            assert(envValue !== "", "Should have default in .env");

            const parsedValue = Number(envValue);

            assert(!isNaN(parsedValue), `${envName} is not a number`);

            return parsedValue;
        }
    },
    {
        envName: "QUOTA_CRITICAL_THRESHOLD",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            const n = Number.parseFloat(envValue.trim().replace(/%$/, ""));

            if (isNaN(n)) {
                throw new Error(
                    `${envName} is not well formatted it should be "95%" or "95" or "0.95"`
                );
            }

            if (n <= 1) {
                return n;
            }

            assert(n <= 100, `${envName} ${envValue} is not a valid percentage`);

            return n / 100;
        }
    },
    {
        envName: "SERVICE_CONFIGURATION_EXPANDED_BY_DEFAULT",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `${envName} should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    },
    {
        envName: "DISABLE_DISPLAY_ALL_CATALOG",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `${envName} should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    },
    {
        envName: "S3_DOCUMENTATION_LINK",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue }) => {
            assert(envValue !== "", "Should have default in .env");
            return envValue;
        }
    },
    {
        envName: "VAULT_DOCUMENTATION_LINK",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue }) => {
            assert(envValue !== "", "Should have default in .env");
            return envValue;
        }
    },
    {
        envName: "DARK_MODE",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            assert(
                envValue === "" || envValue === "true" || envValue === "false",
                `${envName} should either be "true" or "false" or "" (not defined)}`
            );

            switch (envValue) {
                case "true":
                    return true;
                case "false":
                    return false;
                case "":
                    return undefined;
            }

            assert<Equals<typeof envValue, never>>(false);
        }
    },
    {
        envName: "LIST_ALLOWED_EMAIL_DOMAINS",
        isUsedInKeycloakTheme: true,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `${envName} should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    },
    {
        envName: "CONTACT_FOR_ADDING_EMAIL_DOMAIN",
        isUsedInKeycloakTheme: true,
        validateAndParseOrGetDefault: ({
            envValue,
            envName
        }): LocalizedString | undefined => {
            if (envValue === "") {
                return undefined;
            }

            if (!getIsJSON5ObjectOrArray(envValue)) {
                return envValue;
            }

            let parsedValue: unknown;

            try {
                parsedValue = JSON5.parse(envValue);
            } catch {
                throw new Error(`${envName} is not a valid JSON`);
            }

            try {
                zLocalizedString.parse(parsedValue);
            } catch (error) {
                throw new Error(
                    `The format of ${envName} is not valid: ${String(error)}`
                );
            }
            assert(is<LocalizedString>(parsedValue));

            return parsedValue;
        }
    },
    {
        envName: "OIDC_DEBUG_LOGS",
        isUsedInKeycloakTheme: false,
        validateAndParseOrGetDefault: ({ envValue, envName }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `${envName} should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    }
]);

type EnvName = Exclude<
    keyof ImportMetaEnv,
    "MODE" | "DEV" | "PROD" | "BASE_URL" | "PUBLIC_URL"
>;

type Entry<N extends EnvName> = {
    envName: N;
    validateAndParseOrGetDefault: (params: {
        envValue: string;
        envName: N;
        env: Record<string, unknown>;
    }) => any;
    isUsedInKeycloakTheme: boolean;
};

function createParsedEnvs<Parser extends Entry<EnvName>>(
    parsers: Parser[]
): {
    env: {
        [K in Parser["envName"]]: ReturnType<
            Extract<Parser, { envName: K }>["validateAndParseOrGetDefault"]
        >;
    } & { PUBLIC_URL: string };
    injectEnvsTransferableToKeycloakTheme: (authorizationUrl: string) => string;
} {
    const parsedValueOrGetterByEnvName: Record<string, any> = {};

    const injectFunctions: ((url: string) => string)[] = [];

    const kcContext =
        window.kcContext?.themeType === "login" ? window.kcContext : undefined;

    const env: any = new Proxy(
        {},
        {
            get: (...[, envName]) => {
                assert(typeof envName === "string");

                if (envName === "PUBLIC_URL") {
                    return PUBLIC_URL;
                }

                assert(envName in parsedValueOrGetterByEnvName);

                const parsedValueOrGetter = parsedValueOrGetterByEnvName[envName];

                return typeof parsedValueOrGetter === "function"
                    ? parsedValueOrGetter()
                    : parsedValueOrGetter;
            }
        }
    );

    const localStoragePrefix = "onyxiaTheme_";

    local_storage_invalidation_strategy: {
        if (kcContext === undefined) {
            break local_storage_invalidation_strategy;
        }

        const themeVersionLocalStorageKey = `${localStoragePrefix}themeVersion`;

        const localStorageThemeVersion = localStorage.getItem(
            themeVersionLocalStorageKey
        );

        if (localStorageThemeVersion === kcContext.themeVersion) {
            break local_storage_invalidation_strategy;
        }

        // Remove all keys from localStorage that start with "onyxiaTheme_"
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            if (key === null) {
                continue;
            }

            if (key.startsWith(localStoragePrefix)) {
                localStorage.removeItem(key);
            }
        }

        localStorage.setItem(themeVersionLocalStorageKey, kcContext.themeVersion);
    }

    for (const parser of parsers) {
        const { envName, validateAndParseOrGetDefault, isUsedInKeycloakTheme } = parser;

        if (envName in parsedValueOrGetterByEnvName) {
            throw new Error(`Duplicate parser for ${envName}`);
        }

        const isProductionKeycloak =
            import.meta.env.MODE === "production" && kcContext !== undefined;

        const getEnvValue = () => {
            if (!isUsedInKeycloakTheme && kcContext !== undefined) {
                throw new Error(
                    `Env ${envName} not labeled as being used in keycloak theme`
                );
            }

            const localStorageKey = `${localStoragePrefix}${envName}`;

            look_in_url: {
                if (kcContext === undefined) {
                    break look_in_url;
                }

                const { wasPresent, value, url_withoutTheParam } = getSearchParam({
                    url: window.location.href,
                    name: envName
                });

                if (!wasPresent) {
                    break look_in_url;
                }

                updateSearchBarUrl(url_withoutTheParam);

                let envValue = value;

                if (isProductionKeycloak) {
                    const kcEnvName = `ONYXIA_${envName}` as const;

                    const kcEnvValue = isAmong(kcEnvNames, kcEnvName)
                        ? kcContext.properties[kcEnvName]
                        : "";

                    if (kcEnvValue !== "") {
                        localStorage.removeItem(localStorageKey);
                        envValue = kcEnvValue;
                    } else {
                        localStorage.setItem(localStorageKey, envValue);
                    }
                }

                return envValue;
            }

            read_what_have_been_injected_by_vite_env: {
                if (isProductionKeycloak) {
                    break read_what_have_been_injected_by_vite_env;
                }

                return import.meta.env[envName];
            }

            restore_from_local_storage: {
                if (!isProductionKeycloak) {
                    break restore_from_local_storage;
                }

                const envValue = localStorage.getItem(localStorageKey);

                if (envValue === null) {
                    break restore_from_local_storage;
                }

                return envValue;
            }

            // NOTE: Here we are in production Keycloak
            // We get the default that was injected at build time. (vite-envs is not enabled in Keycloak)
            // This can happen when the user has never navigated to the login page via onyxia.
            return import.meta.env[envName];
        };

        const replacePUBLIC_URL = (envValue: string) =>
            envValue.replace(/%PUBLIC_URL%/g, PUBLIC_URL);

        if (isUsedInKeycloakTheme) {
            const envValue = getEnvValue();

            if (kcContext === undefined) {
                injectFunctions.push(url =>
                    addOrUpdateSearchParam({
                        url,
                        name: envName,
                        value: envValue.replace(
                            /%PUBLIC_URL%\/custom-resources/g,
                            `${window.location.origin}${PUBLIC_URL}/custom-resources`
                        ),
                        encodeMethod: "encodeURIComponent"
                    })
                );
            }

            parsedValueOrGetterByEnvName[envName] = validateAndParseOrGetDefault({
                envValue: replacePUBLIC_URL(envValue),
                envName,
                env
            });
        } else {
            parsedValueOrGetterByEnvName[envName] = memoize(() =>
                validateAndParseOrGetDefault({
                    envValue: replacePUBLIC_URL(getEnvValue()),
                    envName,
                    env
                })
            );
        }
    }

    function injectEnvsTransferableToKeycloakTheme(authorizationUrl: string): string {
        for (const inject of injectFunctions) {
            authorizationUrl = inject(authorizationUrl);
        }

        return authorizationUrl;
    }

    return { env, injectEnvsTransferableToKeycloakTheme };
}
