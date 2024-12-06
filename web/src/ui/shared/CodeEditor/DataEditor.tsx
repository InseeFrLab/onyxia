import { useState } from "react";
import { GenericCodeEditor } from "./GenericCodeEditor";
import { EditorState } from "@codemirror/state";
import {
    //gutter,
    EditorView,
    lineNumbers,
    drawSelection,
    keymap,
    highlightActiveLineGutter
    //ViewUpdate,
} from "@codemirror/view";
import { lintKeymap, lintGutter } from "@codemirror/lint";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
    syntaxHighlighting,
    indentOnInput,
    bracketMatching,
    foldGutter,
    foldKeymap
} from "@codemirror/language";
import { oneDarkHighlightStyle } from "@codemirror/theme-one-dark";
import {
    autocompletion,
    completionKeymap,
    closeBrackets,
    closeBracketsKeymap
} from "@codemirror/autocomplete";
import { yamlSchema } from "codemirror-json-schema/yaml";
//import type { JSONSchema7 } from "json-schema";
import type { Stringifyable } from "core/tools/Stringifyable";
import YAML from "yaml";
import { useConstCallback } from "powerhooks/useConstCallback";

export type Props = Omit<GenericCodeEditor.Props, "extensions" | "value" | "onChange"> & {
    value: Stringifyable;
    onChange: (newValue: Stringifyable) => void;
    jsonSchema: Record<string, Stringifyable>;
};

export default function DataEditor(props: Props) {
    const { jsonSchema, value, onChange, ...rest } = props;

    const [valueStr, setValueStr] = useState(() => YAML.stringify(value));

    const onChangeStr = useConstCallback((newValueStr: string) => {
        setValueStr(newValueStr);
        try {
            const newValue = YAML.parse(newValueStr);
            onChange(newValue);
        } catch (error) {
            console.error(error);
        }
    });

    return (
        <GenericCodeEditor
            {...rest}
            value={valueStr}
            onChange={onChangeStr}
            extensions={[
                //gutter({ class: "CodeMirror-lint-markers" }),
                bracketMatching(),
                highlightActiveLineGutter(),
                // basicSetup,
                closeBrackets(),
                history(),
                autocompletion(),
                lineNumbers(),
                lintGutter(),
                indentOnInput(),
                drawSelection(),
                foldGutter(),
                keymap.of([
                    ...closeBracketsKeymap,
                    ...defaultKeymap,
                    ...historyKeymap,
                    ...foldKeymap,
                    ...completionKeymap,
                    ...lintKeymap
                ]),
                EditorView.lineWrapping,
                EditorState.tabSize.of(2),
                syntaxHighlighting(oneDarkHighlightStyle),
                yamlSchema(jsonSchema)
            ]}
        />
    );
}
