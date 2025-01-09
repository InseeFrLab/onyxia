import { useState, useMemo } from "react";
import { TextEditor } from "../TextEditor";
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
import { assert, type Equals } from "tsafe/assert";
import memoize from "memoizee";
import { useConst } from "powerhooks/useConst";

export type Props = {
    className?: string;
    id: string;
    defaultHeight: number;
    fallback?: JSX.Element;

    value: Stringifyable;
    onChange: (newValue: Stringifyable) => void;
    jsonSchema: Record<string, Stringifyable>;
};

{
    type Props_Expected = Omit<
        import("../TextEditor").Props,
        "extensions" | "value" | "onChange"
    > &
        Pick<Props, "value" | "onChange" | "jsonSchema">;

    assert<Equals<Props, Props_Expected>>;
}

export default function DataTextEditor(props: Props) {
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

    const JSON_stringify_memo = useConst(() =>
        memoize((value: any) => JSON.stringify(value))
    );

    const extensions = useMemo(
        () => [
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
            ...yamlSchema(jsonSchema)
        ],
        [JSON_stringify_memo(jsonSchema)]
    );

    return (
        <>
            <TextEditor
                {...rest}
                value={valueStr}
                onChange={onChangeStr}
                extensions={extensions}
            />
            <div>
                <h3>Value:</h3>
                <pre>
                    {JSON.stringify(
                        (() => {
                            try {
                                const newValue = YAML.parse(valueStr);
                                return newValue;
                            } catch (error) {
                                return "NOT PARSEABLE";
                            }
                        })(),
                        null,
                        2
                    )}
                </pre>
            </div>
        </>
    );
}
