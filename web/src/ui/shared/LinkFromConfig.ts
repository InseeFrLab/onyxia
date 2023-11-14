import { z } from "zod";
import type { LocalizedString } from "ui/i18n";
import { zLocalizedString } from "ui/i18n/z";
import { assert } from "tsafe/assert";

export type LinkFromConfig = {
    icon?: string;
    label: LocalizedString;
    url: string;
};

export const zLinkFromConfig = z.object({
    "icon": z.string().optional(),
    "label": zLocalizedString,
    "url": z.string()
});

{
    type Got = ReturnType<(typeof zLinkFromConfig)["parse"]>;
    type Expected = LinkFromConfig;

    assert<Got extends Expected ? true : false>();
    assert<Expected extends Got ? true : false>();
}
