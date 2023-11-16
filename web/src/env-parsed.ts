/* In keycloak-theme, this should be evaluated early */

import { getEnv, type EnvName } from "env";
import { kcContext as kcLoginThemeContext } from "keycloak-theme/login/kcContext";
import {
    retrieveParamFromUrl,
    addParamToUrl,
    updateSearchBarUrl
} from "powerhooks/tools/urlSearchParams";
import { assert, type Equals } from "tsafe/assert";
import { is } from "tsafe/is";
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

export const { env, injectTransferableEnvsInQueryParams } = createParsedEnvs([
    {
        "envName": "HEADER_LOGO",
        "isUsedInKeycloakTheme": true,
        "validateAndParseOrGetDefault": ({ envValue, envName }): ThemedAssetUrl => {
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
        "envName": "PALETTE_OVERRIDE",
        "isUsedInKeycloakTheme": true,
        "validateAndParseOrGetDefault": ({
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
                throw new Error(`${envName} is not parsable JSON`);
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
        "envName": "SPLASHSCREEN_LOGO",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({
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
        "envName": "SPLASHSCREEN_LOGO_SCALE_FACTOR",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue, envName }) => {
            assert(envValue !== "Should have default in .env");

            const parsedValue = Number(envValue);

            assert(!isNaN(parsedValue), `${envName} is not a number`);

            return parsedValue;
        }
    },

    {
        "envName": "HEADER_TEXT_BOLD",
        "isUsedInKeycloakTheme": true,
        "validateAndParseOrGetDefault": ({ envValue }) => {
            if (envValue === "") {
                return undefined;
            }
            return envValue;
        }
    },
    {
        "envName": "HEADER_TEXT_FOCUS",
        "isUsedInKeycloakTheme": true,
        "validateAndParseOrGetDefault": ({ envValue }) => {
            assert(envValue !== "", "Should have default in .env");
            return envValue;
        }
    },
    {
        "envName": "TAB_TITLE",
        "isUsedInKeycloakTheme": true,
        "validateAndParseOrGetDefault": ({ envValue }) => {
            assert(envValue !== "", "Should have default in .env");
            return envValue;
        }
    },
    {
        "envName": "TERMS_OF_SERVICES",
        "isUsedInKeycloakTheme": true,
        "validateAndParseOrGetDefault": ({
            envValue,
            envName
        }): Partial<Record<Language, string>> | string | undefined => {
            if (envValue === "") {
                return undefined;
            }

            if (!getIsJSON5ObjectOrArray(envValue)) {
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

            return tosUrlByLng;
        }
    },
    {
        "envName": "FAVICON",
        "isUsedInKeycloakTheme": true,
        "validateAndParseOrGetDefault": ({
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
        "envName": "FONT",
        "isUsedInKeycloakTheme": true,
        "validateAndParseOrGetDefault": ({ envValue, envName }) => {
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
                "fontFamily": z.string(),
                "dirUrl": z.string(),
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

            return parsedValue;
        }
    },
    {
        "envName": "LEFTBAR_LINKS",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue, envName }): LinkFromConfig[] => {
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
                            "code": z.ZodIssueCode.custom,
                            "message": `You can specify endIcons in ${envName}, see: ${JSON.stringify(
                                data
                            )}`
                        });
                    }

                    if (data.startIcon === undefined && data.icon === undefined) {
                        ctx.addIssue({
                            "code": z.ZodIssueCode.custom,
                            "message": `You must chose an icon for ${JSON.stringify(
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
        "envName": "HEADER_LINKS",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue, envName }) => {
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
                            "code": z.ZodIssueCode.custom,
                            "message": `You can specify endIcons in ${envName}, see: ${JSON.stringify(
                                data
                            )}`
                        });
                    }

                    if (data.startIcon === undefined && data.icon === undefined) {
                        ctx.addIssue({
                            "code": z.ZodIssueCode.custom,
                            "message": `You must chose an icon for ${JSON.stringify(
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
        "envName": "DISABLE_HOMEPAGE",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue, envName }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `${envName} should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    },
    {
        "envName": "HOMEPAGE_LOGO",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({
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
        "envName": "HOMEPAGE_MAIN_ASSET",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({
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
        "envName": "HOMEPAGE_MAIN_ASSET_X_OFFSET",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue, envName }) => {
            assert(envValue !== "", "Should have default in .env");

            try {
                return parseCssSpacing(envValue);
            } catch (error) {
                throw new Error(`${envName} is malformed. ${String(error)}`);
            }
        }
    },
    {
        "envName": "HOMEPAGE_MAIN_ASSET_Y_OFFSET",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue, envName }) => {
            assert(envValue !== "Should have default in .env");

            try {
                return parseCssSpacing(envValue);
            } catch (error) {
                throw new Error(`${envName} is malformed. ${String(error)}`);
            }
        }
    },
    {
        "envName": "HOMEPAGE_MAIN_ASSET_SCALE_FACTOR",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue, envName }) => {
            assert(envValue !== "", "Should have default in .env");

            const parsedValue = Number(envValue);

            assert(!isNaN(parsedValue), `${envName} is not a number`);

            return parsedValue;
        }
    },
    {
        "envName": "HOMEPAGE_HERO_TEXT",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({
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
        "envName": "HOMEPAGE_HERO_TEXT_AUTHENTICATED",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({
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
        "envName": "HOMEPAGE_BELOW_HERO_TEXT",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({
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
        "envName": "HOMEPAGE_BELOW_HERO_TEXT_AUTHENTICATED",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({
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
        "envName": "HOMEPAGE_CALL_TO_ACTION_BUTTON",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({
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
        "envName": "HOMEPAGE_CALL_TO_ACTION_BUTTON_AUTHENTICATED",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({
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
        "envName": "HOMEPAGE_CARDS",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue, envName }) => {
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
                    "pictogram": zAssetVariantUrl,
                    "title": zLocalizedString,
                    "description": zLocalizedString,
                    "button": zLinkFromConfig
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
        "envName": "BACKGROUND_ASSET",
        "isUsedInKeycloakTheme": true,
        "validateAndParseOrGetDefault": ({
            envValue,
            envName
        }): ThemedAssetUrl | undefined => {
            if (envValue === "false") {
                return undefined;
            }

            if (envValue === "") {
                return {
                    "dark": onyxiaNeumorphismDarkModeUrl,
                    "light": onyxiaNeumorphismLightModeUrl
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
        "envName": "DISABLE_AUTO_LAUNCH",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue, envName }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `${envName} should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    },
    {
        "envName": "HEADER_HIDE_ONYXIA",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue, envName }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `${envName} should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    },
    {
        "envName": "GLOBAL_ALERT",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue, envName }) => {
            if (envValue === "") {
                return undefined;
            }

            type ParsedValue = {
                severity: "error" | "warning" | "info" | "success";
                message: LocalizedString;
            };

            if (!getIsJSON5ObjectOrArray(envValue)) {
                return id<ParsedValue>({
                    "severity": "info" as const,
                    "message": envValue
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
                    "severity": "info" as const,
                    "message": parsedValue
                });
            }

            const zParsedValue = z.object({
                "severity": z.enum(["error", "warning", "info", "success"]),
                "message": zLocalizedString
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
        "envName": "DISABLE_PERSONAL_INFOS_INJECTION_IN_GROUP",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue, envName }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `${envName} should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    },
    {
        "envName": "DISABLE_COMMAND_BAR",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `DISABLE_COMMAND_BAR should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    },
    {
        "envName": "ENABLED_LANGUAGES",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue }): readonly Language[] => {
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
                    JSON.stringify(process.env.NODE_ENV) + " " + String(error)
                );
            }
        }
    },
    {
        "envName": "ONYXIA_VERSION",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue }) =>
            envValue === "" ? undefined : envValue
    },
    {
        "envName": "ONYXIA_VERSION_URL",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue }) =>
            envValue === "" ? undefined : envValue
    }
]);

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
    injectTransferableEnvsInQueryParams: (url: string) => string;
} {
    const parsedValueOrGetterByEnvName: Record<string, any> = {};

    const injectFunctions: ((url: string) => string)[] = [];

    const PUBLIC_URL = (() => {
        const kcContext = (() => {
            if (kcLoginThemeContext !== undefined) {
                return kcLoginThemeContext;
            }

            return undefined;
        })();

        return kcContext === undefined || process.env.NODE_ENV === "development"
            ? process.env.PUBLIC_URL
            : `${kcContext.url.resourcesPath}/build`;
    })();

    const env: any = new Proxy(
        {},
        {
            "get": (...[, envName]) => {
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

    for (const parser of parsers) {
        const { envName, validateAndParseOrGetDefault, isUsedInKeycloakTheme } = parser;

        if (envName in parsedValueOrGetterByEnvName) {
            throw new Error(`Duplicate parser for ${envName}`);
        }

        const isProductionKeycloak =
            process.env.NODE_ENV === "production" && kcLoginThemeContext !== undefined;

        const getEnvValue = () => {
            if (!isUsedInKeycloakTheme && kcLoginThemeContext !== undefined) {
                throw new Error(
                    `Env ${envName} not labeled as being used in keycloak theme`
                );
            }

            look_in_url: {
                const result = retrieveParamFromUrl({
                    "url": window.location.href,
                    "name": envName
                });

                if (!result.wasPresent) {
                    break look_in_url;
                }

                const { newUrl, value: envValue } = result;

                updateSearchBarUrl(newUrl);

                if (isProductionKeycloak) {
                    localStorage.setItem(envName, envValue);
                }

                return envValue;
            }

            read_what_have_been_injected_by_cra_envs: {
                if (isProductionKeycloak) {
                    break read_what_have_been_injected_by_cra_envs;
                }

                return getEnv()[envName];
            }

            restore_from_local_storage: {
                if (!isProductionKeycloak) {
                    break restore_from_local_storage;
                }

                const envValue = localStorage.getItem(envName);

                if (envValue === null) {
                    break restore_from_local_storage;
                }

                return envValue;
            }

            // NOTE: Here we are in production Keycloak
            // We get the default that was injected at build time. (cra-envs do not work with keycloak)
            // This can happen when the user has never navigated to the login page via onyxia.
            return getEnv()[envName];
        };

        const replacePUBLIC_URL = (envValue: string) =>
            envValue.replace(/%PUBLIC_URL%/g, PUBLIC_URL);

        if (isUsedInKeycloakTheme) {
            const envValue = getEnvValue();

            injectFunctions.push(
                url => addParamToUrl({ url, "name": envName, "value": envValue }).newUrl
            );

            parsedValueOrGetterByEnvName[envName] = validateAndParseOrGetDefault({
                "envValue": replacePUBLIC_URL(envValue),
                envName,
                env
            });
        } else {
            parsedValueOrGetterByEnvName[envName] = memoize(() =>
                validateAndParseOrGetDefault({
                    "envValue": replacePUBLIC_URL(getEnvValue()),
                    envName,
                    env
                })
            );
        }
    }

    function injectTransferableEnvsInQueryParams(url: string): string {
        let newUrl = url;

        for (const inject of injectFunctions) {
            newUrl = inject(newUrl);
        }

        return newUrl;
    }

    //Do not remove, helper to generate an url to preview the theme.
    /*
    {

        let url = "https://datalab.sspcloud.fr";
        let helmValues = [
            "web:",
            "    env:",
        ].join("\n");

        for (const envName of id<EnvName[]>([
            "FONT",
            "PALETTE_OVERRIDE",
            "HOMEPAGE_MAIN_ASSET",
            "HOMEPAGE_MAIN_ASSET_X_OFFSET",
            "HOMEPAGE_MAIN_ASSET_Y_OFFSET",
            "HOMEPAGE_MAIN_ASSET_SCALE_FACTOR",
            "HEADER_TEXT_FOCUS"
        ])) {

            const envValue = getEnv()[envName];

            url = addParamToUrl({ url, "name": envName, "value": envValue }).newUrl;

            if (envValue === "") {
                continue;
            }

            if (envName === "FONT" || envName === "PALETTE_OVERRIDE") {


                helmValues += `\n        ${envName}: |\n            ${JSON.stringify(JSON5.parse(envValue), null, 2).split("\n").join("\n            ")}`;
            } else {

                helmValues += [
                    `\n        ${envName}: "${env[envName]}"`,
                ].join("\n");

            }

        }

        console.log(helmValues);

        console.log(url);

    }
    */

    return { env, injectTransferableEnvsInQueryParams };
}
