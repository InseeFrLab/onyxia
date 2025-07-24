import type { Stringifyable } from "core/tools/Stringifyable";
import type { FormFieldValue, RootForm } from "../../formTypes";
import { assert, type Equals } from "tsafe/assert";
import { assignValueAtPath, getValueAtPath } from "core/tools/Stringifyable";
import { findInRootForm, findInRootForm_rangeSlider } from "./findInRootForm";

export function mutateHelmValues_update(params: {
    helmValues: Record<string, Stringifyable>;
    formFieldValue: FormFieldValue;
    /** NOTE: RootForm is readonly we only mutate helmValues */
    rootForm: RootForm;
}): void {
    const { helmValues, formFieldValue, rootForm } = params;

    sliders: {
        if (
            formFieldValue.fieldType !== "slider" &&
            formFieldValue.fieldType !== "range slider"
        ) {
            break sliders;
        }

        const updateUnitValue = (params: {
            unit: string | undefined;
            value_formFieldValue: number;
            helmValuesPath: (string | number)[];
        }) => {
            const { unit, value_formFieldValue, helmValuesPath } = params;

            const value = (() => {
                if (unit === undefined || unit === "") {
                    const currentValue = getValueAtPath({
                        stringifyableObjectOrArray: helmValues,
                        path: helmValuesPath,
                        doDeleteFromSource: false,
                        doFailOnUnresolved: false
                    });

                    assert(currentValue !== undefined);

                    switch (typeof currentValue) {
                        case "string":
                            return `${value_formFieldValue}`;
                        case "number":
                            return value_formFieldValue;
                    }
                    assert(false);
                }

                return `${value_formFieldValue}${unit}`;
            })();

            assignValueAtPath({
                stringifyableObjectOrArray: helmValues,
                path: helmValuesPath,
                value
            });
        };

        switch (formFieldValue.fieldType) {
            case "range slider": {
                const formField = findInRootForm_rangeSlider({
                    rootForm,
                    helmValuesPath_lowEndRange: formFieldValue.lowEndRange.helmValuesPath,
                    helmValuesPath_highEndRange:
                        formFieldValue.highEndRange.helmValuesPath
                });

                for (const range of [
                    formFieldValue.lowEndRange,
                    formFieldValue.highEndRange
                ] as const) {
                    updateUnitValue({
                        unit: formField.unit,
                        value_formFieldValue: range.value,
                        helmValuesPath: range.helmValuesPath
                    });
                }

                return;
            }
            case "slider": {
                const formField = findInRootForm({
                    rootForm,
                    helmValuesPath: formFieldValue.helmValuesPath
                });

                assert(formField.fieldType === "slider");

                updateUnitValue({
                    unit: formField.unit,
                    value_formFieldValue: formFieldValue.value,
                    helmValuesPath: formFieldValue.helmValuesPath
                });

                return;
            }
        }

        assert<Equals<typeof formFieldValue, never>>(false);
    }

    switch (formFieldValue.fieldType) {
        case "checkbox":
        case "yaml code block":
        case "number field":
        case "text field":
            assignValueAtPath({
                stringifyableObjectOrArray: helmValues,
                path: formFieldValue.helmValuesPath,
                value: formFieldValue.value
            });
            return;
        case "select": {
            const formField = findInRootForm({
                rootForm,
                helmValuesPath: formFieldValue.helmValuesPath
            });

            assert(formField.fieldType === "select");

            const value = formField.options[formFieldValue.selectedOptionIndex];

            assert(value !== undefined);

            assignValueAtPath({
                stringifyableObjectOrArray: helmValues,
                path: formFieldValue.helmValuesPath,
                value
            });

            return;
        }
    }

    assert<Equals<typeof formFieldValue, never>>(false);
}
