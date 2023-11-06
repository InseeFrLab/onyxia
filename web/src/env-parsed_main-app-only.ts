/* In this file are defined the parser for the environment variables
 * that don't need to be available in the Keycloak theme.
 * If you call any getParsed_XXX() function in a Keycloak context you'll get an error.
 * This mean that the parser should be moved to the ./envParsedUiAndKeycloak.ts file.
 */

import type { LocalizedString, Language } from "ui/i18n";
import { getEnv, type EnvName } from "env";
import memoize from "memoizee";
import { z } from "zod";
import { assert } from "tsafe/assert";
import { removeDuplicates } from "evt/tools/reducers/removeDuplicates";
import { zLocalizedString, zLanguage, languages } from "ui/i18n/z";
import { kcContext as kcLoginThemeContext } from "keycloak-theme/login/kcContext";

export type AdminProvidedLink = {
    iconId: string;
    label: LocalizedString;
    url: string;
};

export const { getParsed_EXTRA_LEFTBAR_ITEMS } = registerEnvParser({
    "envName": "EXTRA_LEFTBAR_ITEMS",
    "validateAndParseOrGetDefault": ({ envValue, envName }) => {
        if (envValue === "") {
            return undefined;
        }

        const errorMessage = `${envName} is malformed`;

        let extraLeftBarItems: AdminProvidedLink[];

        try {
            extraLeftBarItems = JSON.parse(envValue);
        } catch {
            throw new Error(errorMessage);
        }

        assert(
            extraLeftBarItems instanceof Array &&
                extraLeftBarItems.find(
                    extraLeftBarItem =>
                        !(
                            extraLeftBarItem instanceof Object &&
                            typeof extraLeftBarItem.url === "string" &&
                            (typeof extraLeftBarItem.label === "string" ||
                                extraLeftBarItem.label instanceof Object)
                        )
                ) === undefined,
            errorMessage
        );

        return extraLeftBarItems;
    }
});

export const { getParsed_HEADER_LINKS } = registerEnvParser({
    "envName": "HEADER_LINKS",
    "validateAndParseOrGetDefault": ({ envValue, envName }) => {
        if (envValue === "") {
            return undefined;
        }

        const errorMessage = `${envName} is malformed`;

        let extraLeftBarItems: AdminProvidedLink[];

        try {
            extraLeftBarItems = JSON.parse(envValue);
        } catch {
            throw new Error(errorMessage);
        }

        assert(
            extraLeftBarItems instanceof Array &&
                extraLeftBarItems.find(
                    extraLeftBarItem =>
                        !(
                            extraLeftBarItem instanceof Object &&
                            typeof extraLeftBarItem.url === "string" &&
                            (typeof extraLeftBarItem.label === "string" ||
                                extraLeftBarItem.label instanceof Object)
                        )
                ) === undefined,
            errorMessage
        );

        return extraLeftBarItems;
    }
});

export const { getParsed_DISABLE_HOME_PAGE } = registerEnvParser({
    "envName": "DISABLE_HOME_PAGE",
    "validateAndParseOrGetDefault": ({ envValue, envName }) => {
        const possibleValues = ["true", "false"];

        assert(
            possibleValues.indexOf(envValue) >= 0,
            `${envName} should either be ${possibleValues.join(" or ")}`
        );

        return envValue === "true";
    }
});

export const { getParsed_DISABLE_AUTO_LAUNCH } = registerEnvParser({
    "envName": "DISABLE_AUTO_LAUNCH",
    "validateAndParseOrGetDefault": ({ envValue, envName }) => {
        const possibleValues = ["true", "false"];

        assert(
            possibleValues.indexOf(envValue) >= 0,
            `${envName} should either be ${possibleValues.join(" or ")}`
        );

        return envValue === "true";
    }
});

export const { getParsed_HEADER_HIDE_ONYXIA } = registerEnvParser({
    "envName": "HEADER_HIDE_ONYXIA",
    "validateAndParseOrGetDefault": ({ envValue, envName }) => {
        const possibleValues = ["true", "false"];

        assert(
            possibleValues.indexOf(envValue) >= 0,
            `${envName} should either be ${possibleValues.join(" or ")}`
        );

        return envValue === "true";
    }
});

export const { getParsed_GLOBAL_ALERT } = registerEnvParser({
    "envName": "GLOBAL_ALERT",
    "validateAndParseOrGetDefault": ({ envValue, envName }) => {
        if (envValue === "") {
            return undefined;
        }

        if (/^\s*\{.*\}\s*$/.test(envValue.replace(/\r?\n/g, " "))) {
            const zSchema = z.object({
                "severity": z.enum(["error", "warning", "info", "success"]),
                "message": zLocalizedString
            });

            let parsedEnvValue: z.infer<typeof zSchema>;

            try {
                parsedEnvValue = JSON.parse(envValue);

                zSchema.parse(parsedEnvValue);
            } catch {
                throw new Error(`${envName} is malformed, ${envValue}`);
            }

            return parsedEnvValue;
        }

        return {
            "severity": "info" as const,
            "message": envValue
        };
    }
});

export const { getParsed_DISABLE_PERSONAL_INFOS_INJECTION_IN_GROUP } = registerEnvParser({
    "envName": "DISABLE_PERSONAL_INFOS_INJECTION_IN_GROUP",
    "validateAndParseOrGetDefault": ({ envValue, envName }) => {
        const possibleValues = ["true", "false"];

        assert(
            possibleValues.indexOf(envValue) >= 0,
            `${envName} should either be ${possibleValues.join(" or ")}`
        );

        return envValue === "true";
    }
});

export const { getParsed_DISABLE_COMMAND_BAR } = registerEnvParser({
    "envName": "DISABLE_COMMAND_BAR",
    "validateAndParseOrGetDefault": ({ envValue }) => {
        const possibleValues = ["true", "false"];

        assert(
            possibleValues.indexOf(envValue) >= 0,
            `DISABLE_COMMAND_BAR should either be ${possibleValues.join(" or ")}`
        );

        return envValue === "true";
    }
});

export const { getParsed_ENABLED_LANGUAGES } = registerEnvParser({
    "envName": "ENABLED_LANGUAGES",
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
            throw new Error(JSON.stringify(process.env.NODE_ENV) + " " + String(error));
        }
    }
});

function registerEnvParser<T, N extends EnvName>(params: {
    envName: N;
    validateAndParseOrGetDefault: (params: { envValue: string; envName: N }) => T;
}): Record<`getParsed_${N}`, () => T> {
    const { envName, validateAndParseOrGetDefault } = params;

    function replaceAllPublicUrl(valueStr: string): string {
        return valueStr.replace(/%PUBLIC_URL%/g, process.env.PUBLIC_URL);
    }

    const getter = memoize(() => {
        assert(
            kcLoginThemeContext === undefined,
            "Trying to access an env that has not been passed over to the keycloak theme"
        );

        return validateAndParseOrGetDefault({
            "envValue": replaceAllPublicUrl(getEnv()[envName]),
            envName
        });
    });

    return { [`getParsed_${envName}`]: getter } as any;
}
