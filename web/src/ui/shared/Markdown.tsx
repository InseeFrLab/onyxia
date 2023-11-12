import { createMarkdown } from "onyxia-ui/Markdown";
import { session } from "ui/routes";
import type { Param0 } from "tsafe";
import { type LocalizedString, useResolveLocalizedString } from "ui/i18n";

export const { Markdown } = createMarkdown({
    "getLinkProps": ({ href }) => ({
        href,
        "target": !href.startsWith("/") ? "_blank" : undefined,
        "onClick": !href.startsWith("/")
            ? undefined
            : e => {
                  e.preventDefault();
                  session.push(href);
              }
    })
});

export function LocalizedMarkdown(
    props: Omit<Param0<typeof Markdown>, "children"> & { children: LocalizedString }
) {
    const { children, ...rest } = props;

    const { resolveLocalizedStringDetailed } = useResolveLocalizedString({
        "labelWhenMismatchingLanguage": true
    });

    const { langAttrValue, str } = resolveLocalizedStringDetailed(children);

    return (
        <Markdown {...rest} lang={langAttrValue}>
            {str}
        </Markdown>
    );
}
