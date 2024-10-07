import type { ReactNode } from "react";
import { tss } from "tss";
import { FormFieldGroupComponentWrapper } from "./FormFieldGroupComponentWrapper";
import type {
    FormFieldValue,
    FormField,
    FormFieldGroup
} from "core/usecases/launcher/decoupledLogic/formTypes";
import { CheckboxFormField } from "../formFields/CheckboxFormField";
import { YamlCodeBlockFormField } from "../formFields/YamlCodeBlockFormField";
import { NumberFormField } from "../formFields/NumberFormField";
import { SelectFormField } from "../formFields/SelectFormField";
import { TextFormField } from "../formFields/TextFormField";
import { SliderFormField } from "../formFields/SliderFormField";
import { RangeSliderFormField } from "../formFields/RangeSliderFormField";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { assert } from "tsafe/assert";
import type { Stringifyable } from "core/tools/Stringifyable";

type Props = {
    className?: string;
    description: string | undefined;
    helmValuesPath: (string | number)[];

    children: (FormField | FormFieldGroup)[];

    onChangeFormFieldValue: (params: FormFieldValue) => void;
    onAdd: ((params: { helmValuesPath: (string | number)[] }) => void) | undefined;
    onRemove:
        | ((params: { helmValuesPath: (string | number)[]; index: number }) => void)
        | undefined;
};

export function FormFieldGroupComponent(props: Props): ReactNode {
    const {
        className,
        description,
        helmValuesPath,
        children,
        onChangeFormFieldValue,
        onAdd,
        onRemove
    } = props;

    const { cx, classes } = useStyles();

    const getOnRemove_child = useCallbackFactory(([index]: [number]) => {
        assert(onRemove !== undefined);

        onRemove({ helmValuesPath, index });
    });

    const getOnChange_checkbox = useCallbackFactory(
        ([helmValuesPathStr]: [string], [value]: [boolean]) =>
            onChangeFormFieldValue({
                "fieldType": "checkbox",
                "helmValuesPath": JSON.parse(helmValuesPathStr),
                value
            })
    );

    const getOnChange_yamlCodeBlock = useCallbackFactory(
        (
            [helmValuesPathStr]: [string],
            [value]: [Record<string, Stringifyable> | Stringifyable[]]
        ) =>
            onChangeFormFieldValue({
                "fieldType": "yaml code block",
                "helmValuesPath": JSON.parse(helmValuesPathStr),
                value
            })
    );

    const getOnChange_number = useCallbackFactory(
        ([helmValuesPathStr]: [string], [value]: [number]) =>
            onChangeFormFieldValue({
                "fieldType": "number field",
                "helmValuesPath": JSON.parse(helmValuesPathStr),
                value
            })
    );

    const getOnChange_select = useCallbackFactory(
        ([helmValuesPathStr]: [string], [selectedOptionIndex]: [number]) =>
            onChangeFormFieldValue({
                "fieldType": "select",
                "helmValuesPath": JSON.parse(helmValuesPathStr),
                selectedOptionIndex
            })
    );

    const getOnChange_text = useCallbackFactory(
        ([helmValuesPathStr]: [string], [value]: [string]) =>
            onChangeFormFieldValue({
                "fieldType": "text field",
                "helmValuesPath": JSON.parse(helmValuesPathStr),
                value
            })
    );

    const getOnChange_slider = useCallbackFactory(
        ([helmValuesPathStr]: [string], [value]: [number]) =>
            onChangeFormFieldValue({
                "fieldType": "slider",
                "helmValuesPath": JSON.parse(helmValuesPathStr),
                value
            })
    );

    const getOnChange_rangeSlider = useCallbackFactory(
        (
            [helmValuesPathStr_lowEndRange, helmValuesPathStr_highEndRange]: [
                string,
                string
            ],
            [params]: [{ highEndRangeValue: number; lowEndRangeValue: number }]
        ) =>
            onChangeFormFieldValue({
                "fieldType": "range slider",
                "highEndRange": {
                    "helmValuesPath": JSON.parse(helmValuesPathStr_highEndRange),
                    "value": params.highEndRangeValue
                },
                "lowEndRange": {
                    "helmValuesPath": JSON.parse(helmValuesPathStr_lowEndRange),
                    "value": params.lowEndRangeValue
                }
            })
    );

    return (
        <FormFieldGroupComponentWrapper
            className={cx(classes.root, className)}
            description={description}
            onAdd={onAdd === undefined ? undefined : () => onAdd({ helmValuesPath })}
        >
            {children.map((child, index) => {
                const key = JSON.stringify(
                    child.type === "field" && child.fieldType === "range slider"
                        ? [
                              ...child.lowEndRange.helmValuesPath,
                              ...child.highEndRange.helmValuesPath
                          ]
                        : child.helmValuesPath
                );

                if (child.type === "group") {
                    return (
                        <FormFieldGroupComponent
                            key={key}
                            className={className}
                            description={child.description}
                            helmValuesPath={child.helmValuesPath}
                            children={child.children}
                            onChangeFormFieldValue={onChangeFormFieldValue}
                            onAdd={onAdd}
                            onRemove={onRemove}
                        />
                    );
                }

                const onRemove_child =
                    onRemove === undefined ? undefined : getOnRemove_child(index);

                switch (child.fieldType) {
                    case "checkbox":
                        return (
                            <CheckboxFormField
                                key={key}
                                title={child.title}
                                description={child.description}
                                isReadonly={child.isReadonly}
                                onRemove={onRemove_child}
                                value={child.value}
                                onChange={getOnChange_checkbox(
                                    JSON.stringify(child.helmValuesPath)
                                )}
                            />
                        );
                    case "yaml code block":
                        return (
                            <YamlCodeBlockFormField
                                key={key}
                                title={child.title}
                                description={child.description}
                                expectedDataType={child.expectedDataType}
                                onRemove={onRemove_child}
                                value={child.value}
                                onChange={getOnChange_yamlCodeBlock(
                                    JSON.stringify(child.helmValuesPath)
                                )}
                            />
                        );
                    case "number field":
                        return (
                            <NumberFormField
                                key={key}
                                title={child.title}
                                isReadonly={child.isReadonly}
                                description={child.description}
                                isInteger={child.isInteger}
                                minimum={child.minimum}
                                onRemove={onRemove_child}
                                value={child.value}
                                onChange={getOnChange_number(
                                    JSON.stringify(child.helmValuesPath)
                                )}
                            />
                        );
                    case "select":
                        return (
                            <SelectFormField
                                key={key}
                                title={child.title}
                                description={child.description}
                                isReadonly={child.isReadonly}
                                options={child.options}
                                onRemove={onRemove_child}
                                selectedOptionIndex={child.selectedOptionIndex}
                                onSelectedOptionIndexChange={getOnChange_select(
                                    JSON.stringify(child.helmValuesPath)
                                )}
                            />
                        );
                    case "text field":
                        return (
                            <TextFormField
                                key={key}
                                title={child.title}
                                description={child.description}
                                isReadonly={child.isReadonly}
                                doRenderAsTextArea={child.doRenderAsTextArea}
                                isSensitive={child.isSensitive}
                                pattern={child.pattern}
                                onRemove={onRemove_child}
                                value={child.value}
                                onChange={getOnChange_text(
                                    JSON.stringify(child.helmValuesPath)
                                )}
                            />
                        );
                    case "slider":
                        return (
                            <SliderFormField
                                key={key}
                                title={child.title}
                                description={child.description}
                                isReadonly={child.isReadonly}
                                min={child.min}
                                max={child.max}
                                unit={child.unit}
                                step={child.step}
                                onRemove={onRemove_child}
                                value={child.value}
                                onChange={getOnChange_slider(
                                    JSON.stringify(child.helmValuesPath)
                                )}
                            />
                        );
                    case "range slider":
                        return (
                            <RangeSliderFormField
                                key={key}
                                title={child.title}
                                unit={child.unit}
                                step={child.step}
                                lowEndRange={{
                                    "isReadonly": child.lowEndRange.isReadonly,
                                    "rangeEndSemantic":
                                        child.lowEndRange.rangeEndSemantic,
                                    "min": child.lowEndRange.min,
                                    "max": child.lowEndRange.max,
                                    "description": child.lowEndRange.description,
                                    "value": child.lowEndRange.value
                                }}
                                highEndRange={{
                                    "isReadonly": child.highEndRange.isReadonly,
                                    "rangeEndSemantic":
                                        child.highEndRange.rangeEndSemantic,
                                    "min": child.highEndRange.min,
                                    "max": child.highEndRange.max,
                                    "description": child.highEndRange.description,
                                    "value": child.highEndRange.value
                                }}
                                onChange={getOnChange_rangeSlider(
                                    JSON.stringify(child.lowEndRange.helmValuesPath),
                                    JSON.stringify(child.highEndRange.helmValuesPath)
                                )}
                            />
                        );
                }
            })}
        </FormFieldGroupComponentWrapper>
    );
}

const useStyles = tss.withName({ FormFieldGroupComponent }).create(() => ({
    "root": {}
}));
