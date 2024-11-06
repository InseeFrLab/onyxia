import CodeMirror, { type Extension } from "@uiw/react-codemirror";
import { createTheme } from "@uiw/codemirror-themes";
import { tags } from "@lezer/highlight";

import { useMemo } from "react";
import { alpha } from "@mui/system";
import { tss } from "../tss";

export type Props = {
    className?: string;
    id: string;
    defaultHeight: number;
    extensions: Extension[];
    value: string;
    onChange: (newValue: string) => void;
};

export default function GenericCodeEditor(props: Props) {
    const { className, id, defaultHeight, extensions, value, onChange } = props;

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

    return (
        <CodeMirror
            className={cx(classes.root, className)}
            id={id}
            value={value}
            onChange={onChange}
            theme={codeMirrorTheme}
            height={`${defaultHeight}px`}
            extensions={extensions}
        />
    );
}

const useStyles = tss.withName({ GenericCodeEditor }).create(({ theme }) => ({
    root: {
        borderRadius: theme.spacing(1),
        overflow: "hidden"
    }
}));
