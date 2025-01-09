import { useState, useMemo, useEffect } from "react";
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
import { json5Schema as codemirror_json_schema_json5 } from "codemirror-json-schema/json5";
import { yamlSchema as codemirror_json_schema_yaml } from "codemirror-json-schema/yaml";
import type { Stringifyable } from "core/tools/Stringifyable";
import YAML from "yaml";
import JSON5 from "json5";
import { useConstCallback } from "powerhooks/useConstCallback";
import { assert, type Equals } from "tsafe/assert";
import memoize from "memoizee";
import { useConst } from "powerhooks/useConst";
import Ajv from "ajv";
import { Text } from "onyxia-ui/Text";
import { tss } from "../tss";
import { capitalize } from "tsafe/capitalize";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { Icon } from "onyxia-ui/Icon";
import ErrorIcon from "@mui/icons-material/Error";

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

type Format = "YAML" | "JSON5";

function serializeValue(params: { value: Stringifyable; format: Format }): string {
    const { value, format } = params;

    switch (format) {
        case "JSON5":
            return JSON5.stringify(value, null, 2);
        case "YAML":
            return YAML.stringify(value);
    }
}

export default function DataTextEditor(props: Props) {
    const { jsonSchema, value: value_default, onChange, ...rest } = props;

    const JSON_stringify_memo = useConst(() =>
        memoize((value: any) => JSON.stringify(value))
    );

    const ajvValidateFunction = useMemo(
        () => ajv.compile(jsonSchema),
        [JSON_stringify_memo(jsonSchema)]
    );

    const [format, setFormat] = useState<Format>("YAML");

    const [valueStr, setValueStr] = useState<string>(() =>
        serializeValue({
            value: value_default,
            format
        })
    );

    const getErrorMsg = useConstCallback((value: Stringifyable) => {
        if (ajvValidateFunction(value)) {
            return undefined;
        }
        const { errors } = ajvValidateFunction;

        assert(!!errors);

        const [error] = errors;

        assert(error !== undefined);

        return error.message ?? "Invalid";
    });

    const [errorMsg, setErrorMsg] = useState<string | undefined>(
        getErrorMsg(value_default)
    );

    useEffect(() => {
        setValueStr(
            serializeValue({
                value: value_default,
                format
            })
        );
        setErrorMsg(getErrorMsg(value_default));
    }, [value_default]);

    const onFormatChange = useConstCallback((newFormat: Format) => {
        const value = (() => {
            switch (format) {
                case "JSON5":
                    return JSON5.parse(valueStr);
                case "YAML":
                    return YAML.parse(valueStr);
            }
        })();

        setFormat(newFormat);
        setValueStr(serializeValue({ value, format: newFormat }));
    });

    const extensions_base = useConst(() => [
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
        syntaxHighlighting(oneDarkHighlightStyle)
    ]);

    const extensions = useMemo(
        () => [
            ...extensions_base,
            ...(() => {
                switch (format) {
                    case "JSON5":
                        return codemirror_json_schema_json5(jsonSchema);
                    case "YAML":
                        return codemirror_json_schema_yaml(jsonSchema);
                }
            })()
        ],
        [format, JSON_stringify_memo(jsonSchema)]
    );

    const onChangeStr = useConstCallback((newValueStr: string) => {
        setValueStr(newValueStr);

        let newValue: Stringifyable;

        switch (format) {
            case "JSON5":
                {
                    try {
                        newValue = JSON5.parse(newValueStr);
                    } catch {
                        setErrorMsg("Not a valid JSON5 string");
                        return;
                    }
                }
                break;
            case "YAML":
                {
                    try {
                        newValue = YAML.parse(newValueStr);
                    } catch {
                        setErrorMsg("Not a valid YAML string");
                        return;
                    }
                }
                break;
        }

        const errorMsg = getErrorMsg(newValue);

        setErrorMsg(errorMsg);

        if (errorMsg === undefined) {
            onChange(newValue);
        }
    });

    const { classes, cx } = useStyles({
        isErrored: errorMsg !== undefined
    });

    return (
        <div className={classes.root}>
            <FormControl className={classes.formatWrapper} variant="standard">
                <Select
                    value={format}
                    label="Format"
                    onChange={event => onFormatChange(event.target.value as any)}
                >
                    <MenuItem value={"YAML"}>YAML</MenuItem>
                    <MenuItem value={"JSON5"}>JSON5</MenuItem>
                </Select>
            </FormControl>

            <TextEditor
                {...rest}
                className={cx(classes.textEditor, rest.className)}
                value={valueStr}
                onChange={onChangeStr}
                extensions={extensions}
            />

            {errorMsg !== undefined && (
                <Text typo="body 2" className={classes.errorText}>
                    <Icon icon={ErrorIcon} />
                    &nbsp;
                    {capitalize(errorMsg)}
                </Text>
            )}
        </div>
    );
}

const useStyles = tss
    .withName({ DataTextEditor })
    .withParams<{ isErrored: boolean }>()
    .create(({ isErrored, theme }) => ({
        root: {
            position: "relative"
        },
        textEditor: {
            boxSizing: "border-box",
            outline: !isErrored
                ? undefined
                : `1px solid ${theme.colors.useCases.alertSeverity.error.main}`
        },
        formatWrapper: {
            position: "absolute",
            zIndex: 1,
            top: theme.spacing(2),
            right: theme.spacing(2),
            borderRadius: 5,
            border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            boxShadow: theme.shadows[2],
            padding: theme.spacing(3)
        },
        errorText: {
            color: theme.colors.useCases.alertSeverity.error.main,
            position: "absolute",
            bottom: theme.spacing(2),
            left: theme.spacing(2),
            padding: theme.spacing(2),
            borderRadius: 5,
            border: `1px solid ${theme.colors.useCases.alertSeverity.error.background}`,
            backgroundColor: theme.colors.useCases.alertSeverity.error.background,
            boxShadow: theme.shadows[2]
        }
    }));
