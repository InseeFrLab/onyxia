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
import Ajv from "ajv";
import { Text } from "onyxia-ui/Text";
import { tss } from "../tss";
import { capitalize } from "tsafe/capitalize";

const ajv = new Ajv();

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

    const JSON_stringify_memo = useConst(() =>
        memoize((value: any) => JSON.stringify(value))
    );

    const ajvValidateFunction = useMemo(
        () => ajv.compile(jsonSchema),
        [JSON_stringify_memo(jsonSchema)]
    );

    const getErrorMsgs = useConstCallback((value: Stringifyable) => {
        if (!ajvValidateFunction(value)) {
            const { errors } = ajvValidateFunction;

            assert(!!errors);

            return errors.map(error => error.message ?? "error");
        }

        return [];
    });

    const [errorMsgs, setErrorMsgs] = useState<string[]>(getErrorMsgs(value));

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

    const onChangeStr = useConstCallback((newValueStr: string) => {
        setValueStr(newValueStr);

        let newValue: Stringifyable;

        try {
            newValue = YAML.parse(newValueStr);
        } catch {
            setErrorMsgs(["Not a valid YAML string"]);
            return;
        }

        const errorMsgs = getErrorMsgs(newValue);

        setErrorMsgs(errorMsgs);

        if (errorMsgs.length !== 0) {
            return;
        }

        onChange(newValue);
    });

    const { classes, cx } = useStyles({
        isErrored: errorMsgs.length !== 0
    });

    return (
        <>
            <TextEditor
                {...rest}
                className={cx(classes.root, rest.className)}
                value={valueStr}
                onChange={onChangeStr}
                extensions={extensions}
            />
            {errorMsgs.map((errorMsg, i) => (
                <Text key={i} typo="body 2" className={classes.errorText}>
                    {capitalize(errorMsg)}
                </Text>
            ))}
        </>
    );
}

const useStyles = tss
    .withName({ DataTextEditor })
    .withParams<{ isErrored: boolean }>()
    .create(({ isErrored, theme }) => ({
        root: {
            boxSizing: "border-box",
            border: !isErrored
                ? undefined
                : `1px solid ${theme.colors.useCases.alertSeverity.error.main}`
        },
        errorText: {
            color: theme.colors.useCases.alertSeverity.error.main
        }
    }));
