import "minimal-polyfills/Object.fromEntries";
import type { SupportedLanguage } from "ui/i18n/translations";
//TODO: Move in a slice, we shouldn't access env directly here.
import { getEnv } from "env";
import { symToStr } from "tsafe/symToStr";
import memoize from "memoizee";
import { assert } from "tsafe/assert";

export type ExtraLeftBarItem = {
    iconId: string;
    label: string | Partial<Record<SupportedLanguage, string>>;
    url: string;
};

export const getExtraLeftBarItemsFromEnv = memoize(
    (): { extraLeftBarItems: ExtraLeftBarItem[] | undefined } => {
        const { EXTRA_LEFTBAR_ITEMS } = getEnv();

        if (EXTRA_LEFTBAR_ITEMS === "") {
            return { "extraLeftBarItems": undefined };
        }

        const errorMessage = `${symToStr({ EXTRA_LEFTBAR_ITEMS })} is malformed`;

        let extraLeftBarItems: ExtraLeftBarItem[];

        try {
            extraLeftBarItems = JSON.parse(EXTRA_LEFTBAR_ITEMS);
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
                        ),
                ) === undefined,
            errorMessage,
        );

        return { extraLeftBarItems };
    },
);

export const getIsHomePageDisabled = memoize((): boolean => {
    const { DISABLE_HOME_PAGE } = getEnv();

    const possibleValues = ["true", "false"];

    assert(
        possibleValues.indexOf(DISABLE_HOME_PAGE) >= 0,
        `${symToStr({ DISABLE_HOME_PAGE })} should either be ${possibleValues.join(
            " or ",
        )}`,
    );

    return DISABLE_HOME_PAGE === "true";
});
