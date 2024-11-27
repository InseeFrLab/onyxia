import { memo, useId, useEffect } from "react";
import { FormFieldWrapper } from "./shared/FormFieldWrapper";
import { useFormField } from "./shared/useFormField";
import Input from "@mui/material/Input";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { assert } from "tsafe/assert";
import { IconButton } from "onyxia-ui/IconButton";
import { getIconUrlByName } from "lazy-icons";

type Props = {
    className?: string;
    title: string;
    isReadonly: boolean;
    description: string | undefined;
    isInteger: boolean;
    minimum: number | undefined;
    onRemove: (() => void) | undefined;
    value: number;
    onChange: (newValue: number) => void;
    onErrorChange: (params: { hasError: boolean }) => void;
    isHidden: boolean;
};

export const NumberFormField = memo((props: Props) => {
    const {
        className,
        title,
        isReadonly,
        description,
        isInteger,
        minimum,
        onRemove,
        value,
        onChange,
        onErrorChange,
        isHidden
    } = props;

    const { serializedValue, setSerializedValue, errorMessageKey, resetToDefault } =
        useFormField<number, string, "below minimum" | "not a number" | "not an integer">(
            {
                serializedValue: `${value}`,
                throttleDelay: 500,
                onChange,
                parse: serializedValue => {
                    if (!/^[0-9.]+$/.test(serializedValue)) {
                        console.log("not a number");
                        return {
                            isValid: false,
                            errorMessageKey: "not a number"
                        };
                    }

                    const value = parseFloat(serializedValue);

                    if (isNaN(value)) {
                        return {
                            isValid: false,
                            errorMessageKey: "not a number"
                        };
                    }

                    if (isInteger && !Number.isInteger(value)) {
                        return {
                            isValid: false,
                            errorMessageKey: "not an integer"
                        };
                    }

                    check_minimum: {
                        if (minimum === undefined) {
                            break check_minimum;
                        }

                        if (value < minimum) {
                            return {
                                isValid: false,
                                errorMessageKey: "below minimum"
                            };
                        }
                    }

                    return {
                        isValid: true,
                        value: value
                    };
                }
            }
        );

    useEffect(() => {
        onErrorChange({ hasError: errorMessageKey !== undefined });
    }, [errorMessageKey]);

    const inputId = useId();

    const { t } = useTranslation({ NumberFormField });

    return (
        <FormFieldWrapper
            className={className}
            title={title}
            description={description}
            error={(() => {
                if (errorMessageKey === undefined) {
                    return undefined;
                }

                if (errorMessageKey === "below minimum") {
                    assert(minimum !== undefined);
                    return t("below minimum", { minimum });
                }

                return t(errorMessageKey);
            })()}
            onResetToDefault={resetToDefault}
            inputId={inputId}
            onRemove={onRemove}
            isHidden={isHidden}
        >
            <Input
                id={inputId}
                readOnly={isReadonly}
                value={serializedValue}
                onChange={event => setSerializedValue(event.target.value)}
            />
            {isInteger && (
                <>
                    <IconButton
                        icon={getIconUrlByName("RemoveCircleOutline")}
                        onClick={() =>
                            setSerializedValue(`${parseInt(serializedValue) - 1}`)
                        }
                    />
                    <IconButton
                        icon={getIconUrlByName("AddCircleOutline")}
                        onClick={() =>
                            setSerializedValue(`${parseInt(serializedValue) + 1}`)
                        }
                    />
                </>
            )}
        </FormFieldWrapper>
    );
});

const { i18n } = declareComponentKeys<
    { K: "below minimum"; P: { minimum: number } } | "not a number" | "not an integer"
>()({ NumberFormField });

export type I18n = typeof i18n;
