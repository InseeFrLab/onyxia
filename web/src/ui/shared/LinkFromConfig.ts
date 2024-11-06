import { z } from "zod";
import type { LocalizedString } from "ui/i18n";
import { zLocalizedString } from "ui/i18n/z";
import { assert } from "tsafe/assert";

export type LinkFromConfig = {
    label: LocalizedString;
    url: string;
    icon?: string;
    startIcon?: string;
    endIcon?: string;
};

export const zLinkFromConfig = z
    .object({
        icon: z.string().optional(),
        label: zLocalizedString,
        url: z.string(),
        startIcon: z.string().optional(),
        endIcon: z.string().optional()
    })
    .superRefine((data, ctx) => {
        if (data.startIcon !== undefined && data.icon !== undefined) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "You can't specify both startIcon and icon"
            });
        }
    });

{
    type Got = ReturnType<(typeof zLinkFromConfig)["parse"]>;
    type Expected = LinkFromConfig;

    assert<Got extends Expected ? true : false>();
    assert<Expected extends Got ? true : false>();
}
