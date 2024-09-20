import { memo, Suspense } from "react";
import type { Stringifyable } from "core/tools/Stringifyable";
import { FormFieldWrapper } from "./shared/FormFieldWrapper";
import { tss } from "tss";
import { useFormField } from "./shared/useFormField";
import YAML from "yaml";
import { declareComponentKeys, useTranslation } from "ui/i18n";

type Props = {
    className?: string;
    title: string;
    description: string | undefined;
    expectedDataType: "object" | "array";
    value: Record<string, Stringifyable> | Stringifyable[];
    onChange: (newValue: Record<string, Stringifyable> | Stringifyable[]) => void;
};

export const YamlCodeBlockFormField = memo((props: Props) => {
    const { className, title, description, expectedDataType, value, onChange } = props;

    const { t } = useTranslation({ YamlCodeBlockFormField });

    const { cx, classes } = useStyles();

    const { serializedValue, setSerializedValue, errorMessageKey, resetToDefault } =
        useFormField<
            Record<string, Stringifyable> | Stringifyable[],
            string,
            "not valid yaml" | "not an array" | "not an object"
        >({
            "serializedValue": JSON.stringify(value),
            onChange,
            "parse": serializedValue => {
                let value: Record<string, Stringifyable> | Stringifyable[];

                try {
                    value = YAML.parse(serializedValue);
                } catch {
                    return {
                        "isValid": false,
                        "errorMessageKey": "not valid yaml"
                    };
                }

                switch (expectedDataType) {
                    case "array":
                        if (!(value instanceof Array)) {
                            return {
                                "isValid": false,
                                "errorMessageKey": "not an array"
                            };
                        }
                        break;
                    case "object":
                        if (!(value instanceof Object) || value instanceof Array) {
                            return {
                                "isValid": false,
                                "errorMessageKey": "not an object"
                            };
                        }
                        break;
                }

                return {
                    "isValid": true,
                    value
                };
            }
        });

    return (
        <FormFieldWrapper
            className={cx(classes.root, className)}
            title={title}
            description={description}
            error={errorMessageKey === undefined ? undefined : t(errorMessageKey)}
            onResetToDefault={resetToDefault}
        >
            <Suspense fallback={null}>
                <input
                    className={cx(classes.input)}
                    value={serializedValue}
                    onChange={e => setSerializedValue(e.target.value)}
                />
            </Suspense>
        </FormFieldWrapper>
    );
});

const useStyles = tss.withName({ YamlCodeBlockFormField }).create({
    "root": {},
    "input": {}
});

const { i18n } = declareComponentKeys<
    "not valid yaml" | "not an array" | "not an object"
>()({ YamlCodeBlockFormField });

export type I18n = typeof i18n;
