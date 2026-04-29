import type { ReactNode } from "react";
import { python } from "@codemirror/legacy-modes/mode/python";
import { r } from "@codemirror/legacy-modes/mode/r";
import { properties } from "@codemirror/legacy-modes/mode/properties";
import { standardSQL } from "@codemirror/legacy-modes/mode/sql";
import { StreamLanguage } from "@codemirror/language";
import { assert, type Equals } from "tsafe/assert";
import { TextEditor } from "../TextEditor";
import type { CodeTextEditorLanguage } from "./CodeTextEditor";

type Language = "python" | "R" | "SQL" | "properties";

export type Props = {
    className?: string;
    id?: string;
    maxHeight?: number;
    value: string;
    onChange: ((newValue: string) => void) | undefined;
    fallback?: JSX.Element;
    children?: ReactNode;
    language: Language;
};

{
    type Props_Expected = Omit<import("../TextEditor").Props, "extensions"> &
        Pick<Props, "language">;

    assert<Equals<Props, Props_Expected>>;
}

assert<Language extends CodeTextEditorLanguage ? true : false>();

const streamLanguageByLanguage = {
    python,
    R: r,
    SQL: standardSQL,
    properties
} satisfies Record<Props["language"], Parameters<typeof StreamLanguage.define>[0]>;

export default function LegacyModeCodeTextEditor(props: Props) {
    const { language, ...rest } = props;

    return (
        <TextEditor
            {...rest}
            extensions={[StreamLanguage.define(streamLanguageByLanguage[language])]}
        />
    );
}
