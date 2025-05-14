import { useMemo, useEffect, useState, memo } from "react";
import { createMarkdown } from "onyxia-ui/Markdown";
import type { Param0 } from "tsafe";
import { type LocalizedString, useResolveLocalizedString } from "ui/i18n";
import { ensureUrlIsSafe } from "./ensureUrlIsSafe";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import memoizee from "memoizee";
import { assert } from "tsafe/assert";
import { symToStr } from "tsafe/symToStr";
import { urlToLink } from "ui/routes";
import { PUBLIC_URL } from "env";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";

// eslint-disable-next-line react-refresh/only-export-components
export const { Markdown } = createMarkdown({
    getLinkProps: ({ href }) => urlToLink(href)
});

/**
 * The localizedString provided as children can represent Markdown, urls
 * or a mix of both.
 * If the source isn't trusted `urlSourceOnly` should be set to true (we enforce the source of the Markdown to be self-hosted).
 */
export const LocalizedMarkdown = memo(
    (
        props: Omit<Param0<typeof Markdown>, "children" | "lang"> & {
            urlSourceOnly?: boolean;
            children: LocalizedString;
        }
    ) => {
        const { children: localizedString, urlSourceOnly = false, ...rest } = props;

        const { resolveLocalizedStringDetailed } = useResolveLocalizedString({
            labelWhenMismatchingLanguage: true
        });

        const { langAttrValue, str: urlOrMarkdown } = useMemo(
            () => resolveLocalizedStringDetailed(localizedString),
            [localizedString, resolveLocalizedStringDetailed]
        );

        const isSafeUrl = useMemo(() => {
            try {
                ensureUrlIsSafe(urlOrMarkdown);
            } catch {
                return false;
            }

            const isSafeUrl = urlOrMarkdown.endsWith(".md");

            if (urlSourceOnly) {
                assert(
                    isSafeUrl,
                    "Rendering of inlined Markdown text isn't allowed here"
                );
            }

            return isSafeUrl;
        }, [urlOrMarkdown, urlSourceOnly]);

        const markdown_tmp = isSafeUrl ? undefined : urlOrMarkdown;

        const [markdown, setMarkdown] = useState<string | undefined>(markdown_tmp);

        useEffectOnValueChange(() => {
            setMarkdown(markdown_tmp);
        }, [markdown_tmp]);

        useEffect(() => {
            if (!isSafeUrl) {
                return;
            }

            let isActive = true;

            (async () => {
                const url = urlOrMarkdown;

                let markdown: string;

                try {
                    markdown = await fetchText_memoized(url);
                } catch {
                    markdown = `Can't resolve ${url}`;
                }

                if (!isActive) {
                    return;
                }

                markdown = markdown.replace(/%PUBLIC_URL%/g, PUBLIC_URL);

                setMarkdown(markdown);
            })();

            return () => {
                isActive = false;
            };
        }, [urlOrMarkdown, isSafeUrl]);

        if (markdown === undefined) {
            return <CircularProgress />;
        }

        return (
            <Markdown {...rest} lang={langAttrValue}>
                {markdown}
            </Markdown>
        );
    }
);

LocalizedMarkdown.displayName = symToStr({ LocalizedMarkdown });

const fetchText_memoized = memoizee((url: string) => fetch(url).then(r => r.text()), {
    promise: true
});
