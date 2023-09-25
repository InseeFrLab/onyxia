import "minimal-polyfills/Object.fromEntries";
import { type LocalizedString, zLocalizedString } from "ui/i18n";
import { getEnv } from "env";
import { symToStr } from "tsafe/symToStr";
import memoize from "memoizee";
import { z } from "zod";
import { assert } from "tsafe/assert";

export type AdminProvidedLink = {
    iconId: string;
    label: LocalizedString;
    url: string;
};

const getAdminProvidedLinksFromEnv = memoize(
    (
        envName: "EXTRA_LEFTBAR_ITEMS" | "HEADER_LINKS"
    ): AdminProvidedLink[] | undefined => {
        const envValue = getEnv()[envName];

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
);

export const getExtraLeftBarItemsFromEnv = () =>
    getAdminProvidedLinksFromEnv("EXTRA_LEFTBAR_ITEMS");
export const getHeaderLinksFromEnv = () => getAdminProvidedLinksFromEnv("HEADER_LINKS");

export const getIsHomePageDisabled = memoize((): boolean => {
    const { DISABLE_HOME_PAGE } = getEnv();

    const possibleValues = ["true", "false"];

    assert(
        possibleValues.indexOf(DISABLE_HOME_PAGE) >= 0,
        `${symToStr({ DISABLE_HOME_PAGE })} should either be ${possibleValues.join(
            " or "
        )}`
    );

    return DISABLE_HOME_PAGE === "true";
});

export const getIsAutoLaunchDisabled = memoize((): boolean => {
    const { DISABLE_AUTO_LAUNCH } = getEnv();

    const possibleValues = ["true", "false"];

    assert(
        possibleValues.indexOf(DISABLE_AUTO_LAUNCH) >= 0,
        `${symToStr({ DISABLE_AUTO_LAUNCH })} should either be ${possibleValues.join(
            " or "
        )}`
    );

    return DISABLE_AUTO_LAUNCH === "true";
});

export const getDoHideOnyxia = memoize((): boolean => {
    const { HEADER_HIDE_ONYXIA } = getEnv();

    const possibleValues = ["true", "false"];

    assert(
        possibleValues.indexOf(HEADER_HIDE_ONYXIA) >= 0,
        `${symToStr({ HEADER_HIDE_ONYXIA })} should either be ${possibleValues.join(
            " or "
        )}`
    );

    return HEADER_HIDE_ONYXIA === "true";
});

export const getGlobalAlert = memoize(() => {
    const key = "GLOBAL_ALERT";

    const envValue = getEnv()[key];

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
            throw new Error(`${key} is malformed, ${envValue}`);
        }

        return parsedEnvValue;
    }

    return {
        "severity": "info" as const,
        "message": envValue
    };
});

export const getDisablePersonalInfosInjectionInGroup = memoize((): boolean => {
    const { DISABLE_PERSONAL_INFOS_INJECTION_IN_GROUP } = getEnv();

    const possibleValues = ["true", "false"];

    assert(
        possibleValues.indexOf(DISABLE_PERSONAL_INFOS_INJECTION_IN_GROUP) >= 0,
        `${symToStr({
            DISABLE_PERSONAL_INFOS_INJECTION_IN_GROUP
        })} should either be ${possibleValues.join(" or ")}`
    );

    return DISABLE_PERSONAL_INFOS_INJECTION_IN_GROUP === "true";
});
