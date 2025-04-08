import { useState, useMemo, useEffect } from "react";
import { TextEditor } from "../TextEditor";
import { EditorState } from "@codemirror/state";
import {
    gutter,
    EditorView,
    lineNumbers,
    drawSelection,
    keymap,
    highlightActiveLineGutter
} from "@codemirror/view";
import { lintKeymap, lintGutter } from "@codemirror/lint";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
    syntaxHighlighting,
    indentOnInput,
    bracketMatching,
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
import { same } from "evt/tools/inDepth/same";
import { JsonSchemaDialog } from "./JsonSchemaDialog";
import { Button } from "onyxia-ui/Button";
import DataObjectIcon from "@mui/icons-material/DataObject";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

const ajv = new Ajv({
    strict: false
});

export type Props = {
    className?: string;
    id?: string;
    maxHeight?: number;
    fallback?: JSX.Element;

    value: Stringifyable;
    onChange: (newValue: Stringifyable) => void;
    onErrorMsgChanged?: (errorMsg: string | undefined) => void;
    jsonSchema: Record<string, Stringifyable> | undefined;

    additionalValidation?: (
        value: Stringifyable
    ) => { isValid: true } | { isValid: false; errorMsg: string };

    allDefaults?: {
        isChecked: boolean;
        onIsCheckedChange: (isChecked: boolean) => void;
    };

    isJson5Enabled?: boolean;
};

{
    type Props_Expected = Omit<
        import("../TextEditor").Props,
        "extensions" | "value" | "onChange" | "children"
    > &
        Pick<
            Props,
            | "value"
            | "onChange"
            | "jsonSchema"
            | "onErrorMsgChanged"
            | "additionalValidation"
            | "allDefaults"
            | "isJson5Enabled"
        >;

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

function parseValue(params: { valueStr: string; format: Format }): Stringifyable {
    const { valueStr, format } = params;
    switch (format) {
        case "JSON5":
            return JSON5.parse(valueStr);
        case "YAML":
            return YAML.parse(valueStr);
    }
}

export default function DataTextEditor(props: Props) {
    const {
        jsonSchema: jsonSchema_props,
        value: value_default,
        onChange,
        onErrorMsgChanged,
        additionalValidation,
        allDefaults,
        isJson5Enabled = true,
        ...rest
    } = props;

    const hasJsonSchema = jsonSchema_props !== undefined;

    const jsonSchema = useMemo(
        (): Record<string, Stringifyable> =>
            jsonSchema_props ?? {
                type: "object",
                properties: {}
            },
        [jsonSchema_props]
    );

    const jsonSchemaStr = useMemo(
        () => JSON.stringify(jsonSchema, null, 2),
        [jsonSchema]
    );

    const ajvValidateFunction = useMemo(() => ajv.compile(jsonSchema), [jsonSchemaStr]);

    const [format, setFormat] = useState<Format>("YAML");

    const [valueStr, setValueStr] = useState<string>(() =>
        serializeValue({
            value: value_default,
            format
        })
    );

    const getErrorMsg = useConstCallback((value: Stringifyable) => {
        if (!ajvValidateFunction(value)) {
            const { errors } = ajvValidateFunction;

            assert(!!errors);

            const [error] = errors;

            assert(error !== undefined);

            return error.message ?? "Invalid";
        }

        if (additionalValidation !== undefined) {
            const result = additionalValidation(value);

            if (!result.isValid) {
                return result.errorMsg;
            }
        }

        return undefined;
    });

    const [errorMsg, setErrorMsg] = useState<string | undefined>(
        getErrorMsg(value_default)
    );

    useEffect(() => {
        let value: Stringifyable | undefined;

        try {
            value = parseValue({
                valueStr,
                format
            });
        } catch {
            value = undefined;
        }

        if (value !== undefined && same(value, value_default)) {
            return;
        }

        setValueStr(
            serializeValue({
                value: value_default,
                format
            })
        );
        setErrorMsg(getErrorMsg(value_default));
    }, [value_default]);

    const onFormatChange = useConstCallback((newFormat: Format) => {
        let value: Stringifyable | undefined;

        try {
            value = parseValue({ valueStr, format });
        } catch {
            value = undefined;
        }

        setFormat(newFormat);

        if (value === undefined) {
            return;
        }

        setValueStr(serializeValue({ value, format: newFormat }));
    });

    useEffect(() => {
        onErrorMsgChanged?.(errorMsg);
    }, [errorMsg]);

    const { classes, cx } = useStyles({
        isErrored: errorMsg !== undefined
    });

    const extensions_base = useConst(() => [
        gutter({ class: "CodeMirror-lint-markers" }),
        bracketMatching(),
        highlightActiveLineGutter(),
        closeBrackets(),
        history(),
        autocompletion(),
        lineNumbers(),
        lintGutter(),
        indentOnInput(),
        drawSelection(),
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
        [format, jsonSchemaStr]
    );

    const onChangeStr = useConstCallback((newValueStr: string) => {
        setValueStr(newValueStr);

        let newValue: Stringifyable;

        try {
            newValue = parseValue({ valueStr: newValueStr, format });
        } catch {
            setErrorMsg(`Not a valid ${format}`);
            return;
        }

        const errorMsg = getErrorMsg(newValue);

        setErrorMsg(errorMsg);

        call_onChange: {
            if (errorMsg !== undefined) {
                break call_onChange;
            }

            {
                let value: Stringifyable | undefined;

                try {
                    value = parseValue({ valueStr, format });
                } catch {
                    value = undefined;
                }

                if (value !== undefined && same(value, newValue)) {
                    break call_onChange;
                }
            }

            onChange(newValue);
        }
    });

    const [isJsonSchemaDialogOpen, setIsJsonSchemaDialogOpen] = useState(false);

    const onJsonSchemaDialogClose = useConstCallback(() =>
        setIsJsonSchemaDialogOpen(false)
    );

    return (
        <TextEditor
            {...rest}
            className={cx(classes.root, rest.className)}
            value={valueStr}
            onChange={onChangeStr}
            extensions={extensions}
            children={
                <>
                    {(isJson5Enabled || allDefaults !== undefined) && (
                        <div className={classes.formatWrapper}>
                            {isJson5Enabled && (
                                <FormControl variant="standard">
                                    <Select
                                        value={format}
                                        label="Format"
                                        onChange={event =>
                                            onFormatChange(event.target.value as any)
                                        }
                                    >
                                        <MenuItem value={"YAML"}>YAML</MenuItem>
                                        <MenuItem value={"JSON5"}>JSON5</MenuItem>
                                    </Select>
                                </FormControl>
                            )}
                            {allDefaults !== undefined && (
                                <FormControlLabel
                                    className={classes.allDefaultsLabel}
                                    control={
                                        <Checkbox
                                            checked={allDefaults.isChecked}
                                            onChange={event =>
                                                allDefaults.onIsCheckedChange(
                                                    event.target.checked
                                                )
                                            }
                                        />
                                    }
                                    label="All defaults"
                                />
                            )}
                        </div>
                    )}

                    {hasJsonSchema && (
                        <>
                            <div className={classes.bottomLeft}>
                                {errorMsg !== undefined && (
                                    <div className={classes.errorTextWrapper}>
                                        <Text typo="body 2" className={classes.errorText}>
                                            <Icon icon={ErrorIcon} />
                                            &nbsp;
                                            {capitalize(errorMsg)}
                                            &nbsp;
                                        </Text>
                                    </div>
                                )}
                                <Button
                                    startIcon={DataObjectIcon}
                                    onClick={() => setIsJsonSchemaDialogOpen(true)}
                                    variant="ternary"
                                >
                                    Schema
                                </Button>
                            </div>

                            <JsonSchemaDialog
                                isOpen={isJsonSchemaDialogOpen}
                                onClose={onJsonSchemaDialogClose}
                                jsonSchemaStr={jsonSchemaStr}
                            />
                        </>
                    )}
                </>
            }
        />
    );
}

const useStyles = tss
    .withName({ DataTextEditor })
    .withParams<{ isErrored: boolean }>()
    .create(({ isErrored, theme }) => ({
        root: {
            position: "relative",
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
            padding: theme.spacing(2),
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(3),
            alignItems: "end",
            "& > *": {
                display: "inline"
            }
        },
        bottomLeft: {
            position: "absolute",
            bottom: theme.spacing(3),
            left: theme.spacing(3),
            display: "flex",
            gap: theme.spacing(3),
            zIndex: 1
        },
        errorTextWrapper: {
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            borderRadius: 5
        },
        errorText: {
            color: theme.colors.useCases.alertSeverity.error.main,
            padding: theme.spacing(2),
            borderRadius: 5,
            border: `1px solid ${theme.colors.useCases.alertSeverity.error.background}`,
            backgroundColor: theme.colors.useCases.alertSeverity.error.background,
            boxShadow: theme.shadows[2]
        },
        allDefaultsLabel: {
            marginRight: 0
        }
    }));
