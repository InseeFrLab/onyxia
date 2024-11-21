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
    onChange: (newValue: string) => void;
    onErrorChange: (params: { hasError: boolean }) => void;
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
        onErrorChange
    } = props;

    const { serializedValue, setSerializedValue, errorMessageKey, resetToDefault } =
        useFormField<string, string, "not matching pattern">({
            throttleDelay: 500,
            serializedValue: value,
            onChange,
            parse: serializedValue => {
                check_pattern: {
                    if (pattern === undefined) {
                        break check_pattern;
                    }

                    if (!new RegExp(pattern).test(serializedValue)) {
                        return {
                            isValid: false,
                            errorMessageKey: "not matching pattern"
                        };
                    }
                }

                return {
                    isValid: true,
                    value: serializedValue
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
            <Input
                id={inputId}
                className={classes.input}
                readOnly={isReadonly}
                type={
                    isSensitiveTextDisclosed === undefined || isSensitiveTextDisclosed
                        ? "text"
                        : "password"
                }
                multiline={doRenderAsTextArea}
                minRows={doRenderAsTextArea ? 3 : undefined}
                endAdornment={(() => {
                    if (isSensitiveTextDisclosed === undefined) {
                        return undefined;
                    }

                    return (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label={t("toggle password visibility")}
                                onClick={() =>
                                    setIsSensitiveTextDisclosed(!isSensitiveTextDisclosed)
                                }
                                icon={getIconUrlByName(
                                    isSensitiveTextDisclosed
                                        ? "VisibilityOff"
                                        : "Visibility"
                                )}
                            />
                        </InputAdornment>
                    );
                })()}
                value={serializedValue}
                onChange={event => setSerializedValue(event.target.value)}
                autoComplete="off"
            />
        </FormFieldWrapper>
    );
});

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
