import type { ReactNode } from "react";
import CodeMirror, { type Extension } from "@uiw/react-codemirror";
import { createTheme } from "@uiw/codemirror-themes";
import { tags } from "@lezer/highlight";

import { useMemo, useState, useEffect } from "react";
import { alpha } from "@mui/material/styles";
import { tss } from "../tss";
import { useDomRect } from "powerhooks/useDomRect";

export type Props = {
    className?: string;
    id: string;
    maxHeight?: number;
    extensions: Extension[];
    value: string;
    onChange: ((newValue: string) => void) | undefined;
    children?: ReactNode;
};

export default function TextEditor(props: Props) {
    const { className, id, extensions, value, onChange, children } = props;

    const height_max = props.maxHeight || undefined;

    const { cx, classes, theme } = useStyles();

    const codeMirrorTheme = useMemo(
        () =>
            createTheme({
                theme: theme.isDarkModeEnabled ? "dark" : "light",
                settings: {
                    background: theme.colors.useCases.surfaces.surface1,
                    foreground: theme.colors.useCases.typography.textPrimary,
                    caret: theme.colors.useCases.typography.textFocus,
                    selection: alpha(theme.colors.useCases.typography.textFocus, 0.6),
                    selectionMatch: alpha(
                        theme.colors.useCases.typography.textFocus,
                        0.3
                    ),
                    lineHighlight: alpha(
                        theme.colors.useCases.typography.textFocus,
                        0.05
                    ),
                    gutterBackground: theme.colors.useCases.surfaces.surface2,
                    gutterForeground: theme.colors.useCases.typography.textTertiary
                },
                styles: [
                    {
                        tag: [tags.comment],
                        color: theme.colors.useCases.typography.textDisabled,
                        fontStyle: "italic"
                    },
                    {
                        tag: [
                            tags.name,
                            tags.deleted,
                            tags.character,
                            tags.propertyName,
                            tags.macroName
                        ],
                        //color: theme.colors.useCases.typography.textSecondary
                        color: alpha(theme.colors.useCases.typography.textPrimary, 0.8)
                    },
                    {
                        tag: [tags.definition(tags.name), tags.separator],
                        color: theme.colors.useCases.typography.textTertiary
                    }
                ]
            }),
        [theme.isDarkModeEnabled]
    );

    const {
        ref,
        domRect: { height }
    } = useDomRect();

    const [height_auto, setHeight_auto] = useState<undefined | number>(undefined);

    useEffect(() => {
        if (height_auto !== undefined) {
            return;
        }

        if (height === 0) {
            return;
        }

        setHeight_auto(height);
    }, [height]);

    const height_enforced = useMemo(() => {
        if (height_auto === undefined) {
            return undefined;
        }

        const height_enforced = height_auto + 80;

        if (height_max !== undefined && height_enforced > height_max) {
            return height_max;
        }

        return height_enforced;
    }, [height_auto, height_max]);

    return (
        <CodeMirror
            ref={reactCodeMirrorRef => {
                (ref as { current: HTMLElement | null }).current =
                    reactCodeMirrorRef?.editor ?? null;
            }}
            className={cx(classes.root, className)}
            id={id}
            value={value}
            onChange={onChange}
            theme={codeMirrorTheme}
            height={`${height_enforced}px`}
            extensions={extensions}
            readOnly={onChange === undefined}
            children={height_enforced === undefined ? undefined : children}
        />
    );
}

const useStyles = tss.withName({ TextEditor }).create(({ theme }) => ({
    root: {
        borderRadius: theme.spacing(1),
        overflow: "hidden",
        "& .cm-tooltip-hover": {
            borderRadius: theme.spacing(2),
            ...theme.spacing.rightLeft("padding", 3),
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            shadow: theme.shadows[1]
        },
        "&&& .cm-tooltip-arrow": {
            "&::before, &::after": {
                borderColor: `${theme.colors.useCases.surfaces.surface2} transparent transparent transparent`
            }
        }
    }
}));
