import { memo, useId, useEffect } from "react";
import type { Stringifyable } from "core/tools/Stringifyable";
import { FormFieldWrapper } from "./shared/FormFieldWrapper";
import { tss } from "tss";
import { useFormField } from "./shared/useFormField";
import YAML from "yaml";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { CodeEditor } from "ui/shared/CodeEditor";

type Props = {
    className?: string;
    title: string;
    description: string | undefined;
    expectedDataType: "object" | "array";
    onRemove: (() => void) | undefined;
    value: Record<string, Stringifyable> | Stringifyable[];
    onChange: (newValue: Record<string, Stringifyable> | Stringifyable[]) => void;
    onErrorChange: (params: { hasError: boolean }) => void;
};

const DEFAULT_HEIGHT = 300;

export const YamlCodeBlockFormField = memo((props: Props) => {
    const {
        className,
        title,
        description,
        expectedDataType,
        onRemove,
        value,
        onChange,
        onErrorChange
    } = props;

    const { t } = useTranslation({ YamlCodeBlockFormField });

    const { cx, classes } = useStyles();

    const { serializedValue, setSerializedValue, errorMessageKey, resetToDefault } =
        useFormField<
            Record<string, Stringifyable> | Stringifyable[],
            string,
            "not valid yaml" | "not an array" | "not an object"
        >({
            throttleDelay: 500,
            serializedValue: YAML.stringify(value),
            onChange,
            parse: serializedValue => {
                let value: Record<string, Stringifyable> | Stringifyable[];

                try {
                    value = YAML.parse(serializedValue);
                } catch {
                    return {
                        isValid: false,
                        errorMessageKey: "not valid yaml"
                    };
                }

                switch (expectedDataType) {
                    case "array":
                        if (!(value instanceof Array)) {
                            return {
                                isValid: false,
                                errorMessageKey: "not an array"
                            };
                        }
                        break;
                    case "object":
                        if (!(value instanceof Object) || value instanceof Array) {
                            return {
                                isValid: false,
                                errorMessageKey: "not an object"
                            };
                        }
                        break;
                }

                return {
                    isValid: true,
                    value
                };
            }
        });

    useEffect(() => {
        onErrorChange({ hasError: errorMessageKey !== undefined });
    }, [errorMessageKey]);

    const inputId = useId();

    return (
        <FormFieldWrapper
            className={className}
            title={title}
            description={description}
            error={errorMessageKey === undefined ? undefined : t(errorMessageKey)}
            onResetToDefault={resetToDefault}
            inputId={inputId}
            onRemove={onRemove}
        >
            <CodeEditor
                fallback={
                    <div className={cx(classes.suspenseFallback)}>
                        <CircularProgress />
                    </div>
                }
                id={inputId}
                value={serializedValue}
                onChange={setSerializedValue}
                defaultHeight={DEFAULT_HEIGHT}
                language="yaml"
            />
        </FormFieldWrapper>
    );
});

const useStyles = tss.withName({ YamlCodeBlockFormField }).create({
    suspenseFallback: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: DEFAULT_HEIGHT
    }
});

const { i18n } = declareComponentKeys<
    "not valid yaml" | "not an array" | "not an object"
>()({ YamlCodeBlockFormField });

export type I18n = typeof i18n;
