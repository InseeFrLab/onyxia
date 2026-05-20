import type { ReactNode } from "react";
import CodeMirror, { type Extension } from "@uiw/react-codemirror";
import { createTheme } from "@uiw/codemirror-themes";
import { tags } from "@lezer/highlight";

import { useMemo, useState, useEffect } from "react";
import { alpha, darken, lighten } from "@mui/material/styles";
import { tss } from "../tss";
import { useDomRect } from "powerhooks/useDomRect";

export type Props = {
    className?: string;
    id?: string;
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

    const {
        isDarkModeEnabled,
        colors: { useCases }
    } = theme;

    const codeMirrorTheme = useMemo(() => {
        const { alertSeverity, surfaces, typography } = useCases;

        const getSyntaxColor = (color: string, coefficient: number) =>
            isDarkModeEnabled ? lighten(color, coefficient) : darken(color, coefficient);

        const syntaxColors = {
            accent: isDarkModeEnabled
                ? typography.textFocus
                : darken(typography.textFocus, 0.08),
            atom: getSyntaxColor(alertSeverity.warning.main, 0.3),
            error: getSyntaxColor(alertSeverity.error.main, 0.08),
            function: getSyntaxColor(alertSeverity.info.main, 0.16),
            invalidBackground: alpha(
                alertSeverity.error.main,
                isDarkModeEnabled ? 0.2 : 0.1
            ),
            meta: alpha(typography.textPrimary, isDarkModeEnabled ? 0.72 : 0.62),
            operator: getSyntaxColor(alertSeverity.info.main, 0.06),
            property: getSyntaxColor(alertSeverity.info.main, 0.22),
            string: getSyntaxColor(alertSeverity.success.main, 0.34),
            variable: alpha(typography.textPrimary, isDarkModeEnabled ? 0.88 : 0.82)
        };

        return createTheme({
            theme: isDarkModeEnabled ? "dark" : "light",
            settings: {
                background: surfaces.surface1,
                foreground: typography.textPrimary,
                caret: typography.textFocus,
                selection: alpha(typography.textFocus, isDarkModeEnabled ? 0.34 : 0.22),
                selectionMatch: alpha(
                    typography.textFocus,
                    isDarkModeEnabled ? 0.22 : 0.14
                ),
                lineHighlight: alpha(
                    typography.textFocus,
                    isDarkModeEnabled ? 0.08 : 0.05
                ),
                gutterBackground: surfaces.surface2,
                gutterForeground: typography.textTertiary,
                gutterActiveForeground: typography.textFocus,
                gutterBorder: alpha(
                    typography.textPrimary,
                    isDarkModeEnabled ? 0.14 : 0.1
                )
            },
            styles: [
                {
                    tag: [tags.comment, tags.docComment],
                    color: typography.textDisabled,
                    fontStyle: "italic"
                },
                {
                    tag: [
                        tags.meta,
                        tags.documentMeta,
                        tags.annotation,
                        tags.processingInstruction
                    ],
                    color: syntaxColors.meta
                },
                {
                    tag: [
                        tags.keyword,
                        tags.controlKeyword,
                        tags.definitionKeyword,
                        tags.moduleKeyword,
                        tags.modifier
                    ],
                    color: syntaxColors.accent,
                    fontWeight: "600"
                },
                {
                    tag: [tags.operatorKeyword, tags.self],
                    color: syntaxColors.accent
                },
                {
                    tag: [
                        tags.atom,
                        tags.bool,
                        tags.null,
                        tags.unit,
                        tags.special(tags.variableName)
                    ],
                    color: syntaxColors.atom,
                    fontWeight: "500"
                },
                {
                    tag: [tags.number, tags.integer, tags.float, tags.color],
                    color: syntaxColors.atom
                },
                {
                    tag: [tags.string, tags.docString, tags.attributeValue],
                    color: syntaxColors.string
                },
                {
                    tag: [
                        tags.escape,
                        tags.regexp,
                        tags.special(tags.string),
                        tags.url,
                        tags.link
                    ],
                    color: syntaxColors.operator
                },
                {
                    tag: [
                        tags.function(tags.variableName),
                        tags.labelName,
                        tags.definition(tags.variableName)
                    ],
                    color: syntaxColors.function,
                    fontWeight: "500"
                },
                {
                    tag: [tags.typeName, tags.className, tags.namespace, tags.macroName],
                    color: syntaxColors.accent
                },
                {
                    tag: [tags.propertyName, tags.attributeName],
                    color: syntaxColors.property
                },
                {
                    tag: [
                        tags.name,
                        tags.character,
                        tags.variableName,
                        tags.local(tags.variableName)
                    ],
                    color: syntaxColors.variable
                },
                {
                    tag: [
                        tags.definition(tags.name),
                        tags.definition(tags.propertyName),
                        tags.constant(tags.name),
                        tags.standard(tags.name)
                    ],
                    color: syntaxColors.property,
                    fontWeight: "500"
                },
                {
                    tag: [
                        tags.operator,
                        tags.derefOperator,
                        tags.arithmeticOperator,
                        tags.logicOperator,
                        tags.bitwiseOperator,
                        tags.compareOperator,
                        tags.updateOperator,
                        tags.definitionOperator,
                        tags.typeOperator,
                        tags.controlOperator
                    ],
                    color: syntaxColors.operator
                },
                {
                    tag: [
                        tags.punctuation,
                        tags.separator,
                        tags.bracket,
                        tags.angleBracket,
                        tags.squareBracket,
                        tags.paren,
                        tags.brace,
                        tags.contentSeparator
                    ],
                    color: typography.textTertiary
                },
                {
                    tag: [tags.heading],
                    color: syntaxColors.accent,
                    fontWeight: "700"
                },
                {
                    tag: [tags.strong],
                    fontWeight: "700"
                },
                {
                    tag: [tags.emphasis],
                    fontStyle: "italic"
                },
                {
                    tag: [tags.strikethrough],
                    textDecoration: "line-through"
                },
                {
                    tag: [tags.inserted],
                    color: syntaxColors.string
                },
                {
                    tag: [tags.deleted],
                    color: syntaxColors.error
                },
                {
                    tag: [tags.changed],
                    color: syntaxColors.atom
                },
                {
                    tag: [tags.invalid],
                    color: syntaxColors.error,
                    backgroundColor: syntaxColors.invalidBackground
                }
            ]
        });
    }, [isDarkModeEnabled, useCases]);

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
