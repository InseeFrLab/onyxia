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
};

export default function TextEditor(props: Props) {
    const { className, id, maxHeight, extensions, value, onChange } = props;

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
                        color: theme.colors.useCases.typography.textSecondary
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
            height={
                (() => {
                    const height =
                        height_auto === undefined ? undefined : height_auto + 80;

                    if (
                        maxHeight !== undefined &&
                        height !== undefined &&
                        height > maxHeight
                    ) {
                        return maxHeight;
                    }

                    return height;
                })() + "px"
            }
            extensions={extensions}
            readOnly={onChange === undefined}
        />
    );
}

const useStyles = tss.withName({ TextEditor }).create(({ theme }) => ({
    root: {
        borderRadius: theme.spacing(1),
        overflow: "hidden"
    }
}));
