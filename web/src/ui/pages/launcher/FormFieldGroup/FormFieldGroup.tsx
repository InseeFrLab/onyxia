import type { ReactNode } from "react";
import { tss } from "tss";
import { FormFieldGroupWrapper } from "./FormFieldGroupWrapper";
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

export function FormFieldGroup(props: Props): ReactNode {
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
        ([helmValuesPathStr, value]: [string, boolean]) =>
            onChangeFormFieldValue({
                "fieldType": "checkbox",
                "helmValuesPath": JSON.parse(helmValuesPathStr),
                value
            })
    );

    return (
        <FormFieldGroupWrapper
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
                        <FormFieldGroup
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
                                onChange={value =>
                                    onChangeFormFieldValue({
                                        "fieldType": "checkbox",
                                        "helmValuesPath": child.helmValuesPath,
                                        value
                                    })
                                }
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
                                onChange={value =>
                                    onChangeFormFieldValue({
                                        "fieldType": "yaml code block",
                                        "helmValuesPath": child.helmValuesPath,
                                        value
                                    })
                                }
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
                                onChange={value =>
                                    onChangeFormFieldValue({
                                        "fieldType": "number field",
                                        "helmValuesPath": child.helmValuesPath,
                                        value
                                    })
                                }
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
                                onSelectedOptionIndexChange={selectedOptionIndex =>
                                    onChangeFormFieldValue({
                                        "fieldType": "select",
                                        "helmValuesPath": child.helmValuesPath,
                                        selectedOptionIndex
                                    })
                                }
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
                                onChange={value =>
                                    onChangeFormFieldValue({
                                        "fieldType": "text field",
                                        "helmValuesPath": child.helmValuesPath,
                                        value
                                    })
                                }
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
                                onChange={value =>
                                    onChangeFormFieldValue({
                                        "fieldType": "slider",
                                        "helmValuesPath": child.helmValuesPath,
                                        value
                                    })
                                }
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
                                    "value": child.lowEndRange.value,
                                    "onChange": value => {}
                                }}
                                highEndRange={{
                                    "isReadonly": child.highEndRange.isReadonly,
                                    "rangeEndSemantic":
                                        child.highEndRange.rangeEndSemantic,
                                    "min": child.highEndRange.min,
                                    "max": child.highEndRange.max,
                                    "description": child.highEndRange.description,
                                    "value": child.highEndRange.value,
                                    "onChange": value => {}
                                }}
                            />
                        );
                }
            })}
        </FormFieldGroupWrapper>
    );
}

const useStyles = tss.withName({ FormFieldGroup }).create(() => ({
    "root": {}
}));
