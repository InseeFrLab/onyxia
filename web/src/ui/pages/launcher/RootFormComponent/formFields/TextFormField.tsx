import { memo, useId, useState, useEffect } from "react";
import Input from "@mui/material/Input";
import InputAdornment from "@mui/material/InputAdornment";
import { FormFieldWrapper } from "./shared/FormFieldWrapper";
import { useFormField } from "./shared/useFormField";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { assert } from "tsafe/assert";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";
import { IconButton } from "onyxia-ui/IconButton";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import { id } from "tsafe/id";
import { same } from "evt/tools/inDepth/same";

type Props = {
    className?: string;
    title: string;
    description: string | undefined;
    isReadonly: boolean;
    doRenderAsTextArea: boolean;
    isSensitive: boolean;
    pattern: string | undefined;
    onRemove: (() => void) | undefined;
    value: string;
    onChange: (params: {
        newValue: string;
        isAutocompleteOptionSelection: boolean;
    }) => void;
    onErrorChange: (params: { hasError: boolean }) => void;
    autocomplete:
        | {
              isLoadingOptions: boolean;
              options: string[];
              onPanelOpen: () => void;
          }
        | undefined;
};

export const TextFormField = memo((props: Props) => {
    const {
        className,
        title,
        description,
        isReadonly,
        doRenderAsTextArea,
        isSensitive,
        pattern,
        onRemove,
        value,
        onChange,
        onErrorChange,
        autocomplete
    } = props;

    type TValue = { newValue: string; isAutocompleteOptionSelection: boolean };

    const { serializedValue, setSerializedValue, errorMessageKey, resetToDefault } =
        useFormField<TValue, string, "not matching pattern">({
            throttleDelay: 500,
            serializedValue: JSON.stringify(
                id<TValue>({ newValue: value, isAutocompleteOptionSelection: false })
            ),
            onChange,
            parse: serializedValue => {
                const { newValue, isAutocompleteOptionSelection } = JSON.parse(
                    serializedValue
                ) as TValue;

                check_pattern: {
                    if (pattern === undefined) {
                        break check_pattern;
                    }

                    const regExp = new RegExp(pattern);

                    const start_time = performance.now();

                    let doesMatch: boolean | undefined;

                    try {
                        doesMatch = regExp.test(newValue);
                    } catch (error) {
                        assert(error instanceof Error);

                        if (/too much recursion|stack|call stack/i.test(error.message)) {
                            doesMatch = undefined;
                        } else {
                            throw error;
                        }
                    }

                    if (performance.now() - start_time > 100 || doesMatch === undefined) {
                        console.error(
                            [
                                "onyxia: Chart author warning",
                                "The RegExp provided as `pattern` in values.schema.json is too expensive to be evaluated",
                                "in a realtime form validation context and is freezing the UI.",
                                `Problematic RegExp: ${pattern}`,
                                "",
                                "Please simplify this RegExp so it validates the same input without catastrophic backtracking.",
                                "In particular, avoid nested quantifiers or ambiguous constructs",
                                "(for example: `([…]+)+`)."
                            ].join("\n")
                        );
                    }

                    if (!doesMatch) {
                        return {
                            isValid: false,
                            errorMessageKey: "not matching pattern"
                        };
                    }
                }

                return {
                    isValid: true,
                    value: {
                        newValue,
                        isAutocompleteOptionSelection
                    }
                };
            }
        });

    useEffect(() => {
        onErrorChange({ hasError: errorMessageKey !== undefined });
    }, [errorMessageKey]);

    const { t } = useTranslation({ TextFormField });

    const inputId = useId();

    const [isSensitiveTextDisclosed, setIsSensitiveTextDisclosed] = useState<
        boolean | undefined
    >(isSensitive ? false : undefined);

    const { classes } = useStyles({
        isTextArea: doRenderAsTextArea
    });

    return (
        <FormFieldWrapper
            className={className}
            title={title}
            description={description}
            error={(() => {
                switch (errorMessageKey) {
                    case "not matching pattern":
                        assert(pattern !== undefined);
                        return t("not matching pattern", { pattern });
                    case undefined:
                        return undefined;
                }
            })()}
            onResetToDefault={resetToDefault}
            inputId={inputId}
            onRemove={onRemove}
        >
            {(() => {
                const commonPropsOfInput = {
                    id: inputId,
                    className: classes.input,
                    readOnly: isReadonly,
                    type:
                        isSensitiveTextDisclosed === undefined || isSensitiveTextDisclosed
                            ? "text"
                            : "password",

                    multiline: doRenderAsTextArea,
                    minRows: doRenderAsTextArea ? 3 : undefined,
                    endAdornment: (() => {
                        if (isSensitiveTextDisclosed === undefined) {
                            return undefined;
                        }

                        return (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label={t("toggle password visibility")}
                                    onClick={() =>
                                        setIsSensitiveTextDisclosed(
                                            !isSensitiveTextDisclosed
                                        )
                                    }
                                    icon={getIconUrlByName(
                                        isSensitiveTextDisclosed
                                            ? "VisibilityOff"
                                            : "Visibility"
                                    )}
                                />
                            </InputAdornment>
                        );
                    })(),
                    name: `${inputId}-no-autofill`,
                    autoComplete: "off"
                };

                if (autocomplete === undefined) {
                    return (
                        <Input
                            {...commonPropsOfInput}
                            value={(JSON.parse(serializedValue) as TValue).newValue}
                            onChange={event => {
                                const newValue = event.target.value;
                                setSerializedValue(
                                    JSON.stringify(
                                        id<TValue>({
                                            newValue,
                                            isAutocompleteOptionSelection: false
                                        })
                                    )
                                );
                            }}
                        />
                    );
                }

                return (
                    <Autocomplete
                        freeSolo
                        options={autocomplete.options}
                        value={(JSON.parse(serializedValue) as TValue).newValue}
                        onOpen={autocomplete.onPanelOpen}
                        loading={autocomplete.isLoadingOptions}
                        loadingText={
                            <>
                                <CircularProgress /> Loading...
                            </>
                        }
                        onChange={(_event: unknown, newValue: string | null) => {
                            if (newValue === null) {
                                return;
                            }

                            setSerializedValue(
                                JSON.stringify(
                                    id<TValue>({
                                        newValue,
                                        isAutocompleteOptionSelection: true
                                    })
                                )
                            );
                        }}
                        onInputChange={event => {
                            if (event === null) {
                                return;
                            }

                            //@ts-expect-error: ok
                            const newValue = event.target.value;

                            setSerializedValue(
                                JSON.stringify(
                                    id<TValue>({
                                        newValue,
                                        isAutocompleteOptionSelection: false
                                    })
                                )
                            );
                        }}
                        renderInput={({ InputProps, InputLabelProps, ...rest }) => (
                            <Input {...InputProps} {...rest} {...commonPropsOfInput} />
                        )}
                    />
                );
            })()}
        </FormFieldWrapper>
    );
}, same);

const useStyles = tss
    .withName({ TextFormField })
    .withParams<{ isTextArea: boolean }>()
    .create(({ theme, isTextArea }) => ({
        input: {
            border: !isTextArea
                ? undefined
                : `1px dotted ${theme.colors.useCases.surfaces.surface1}`,
            width: "99%"
        }
    }));

const { i18n } = declareComponentKeys<
    | "toggle password visibility"
    | {
          K: "not matching pattern";
          P: { pattern: string };
          R: string;
      }
>()({ TextFormField });

export type I18n = typeof i18n;
