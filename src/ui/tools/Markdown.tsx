import { memo, useMemo } from "react";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import Link from "@mui/material/Link";

export type MarkdownProps = {
    children: string;
};

export const Markdown = memo((props: MarkdownProps) => {
    const { children } = props;

    const renderers = useMemo(
        () => ({
            "link": (props: { href: string; children: ReactNode }) => (
                <Link underline="hover" href={props.href}>
                    {props.children}
                </Link>
            ),
        }),
        [],
    );

    return <ReactMarkdown renderers={renderers}>{children}</ReactMarkdown>;
});
