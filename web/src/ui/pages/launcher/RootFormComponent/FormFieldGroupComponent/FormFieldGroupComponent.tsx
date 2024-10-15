import type { ReactNode } from "react";
import { tss } from "tss";
import { FormFieldGroupComponentWrapper } from "./FormFieldGroupComponentWrapper";
import type {
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
import type { FormCallbacks } from "../FormCallbacks";

export type Props = {
    className?: string;
    description: string | undefined;
    helmValuesPath: (string | number)[];
    nodes: (FormField | FormFieldGroup)[];
    canAdd: boolean;
    canRemove: boolean;
    callbacks: FormCallbacks;
};

export function FormFieldGroupComponent(props: Props): ReactNode {
    const {
        className,
        description,
        helmValuesPath,
        canAdd,
        canRemove,
        nodes,
        callbacks
    } = props;

    const { onAdd } = callbacks;

    const { cx, classes } = useStyles();

    return (
        <FormFieldGroupComponentWrapper
            className={cx(classes.root, className)}
            title={(() => {
                const lastSegment = helmValuesPath[helmValuesPath.length - 1];

                if (typeof lastSegment === "number") {
                    return undefined;
                }

                return lastSegment;
            })()}
            description={description}
            onAdd={canAdd ? () => onAdd({ helmValuesPath }) : undefined}
        >
            <FormFieldGroupComponentInner
                className={classes.inner}
                nodes={nodes}
                callbacks={callbacks}
                {...(canRemove
                    ? { "canRemove": true, helmValuesPath }
                    : { "canRemove": false, "helmValuesPath": undefined })}
            />
        </FormFieldGroupComponentWrapper>
    );
}

const useStyles = tss.withName({ FormFieldGroupComponent }).create(() => ({
    "root": {},
    "inner": {}
}));

export function FormFieldGroupComponentInner(
    props: Omit<Props, "description" | "canAdd" | "helmValuesPath" | "canRemove"> &
        (
            | { canRemove: true; helmValuesPath: (string | number)[] }
            | { canRemove: false; helmValuesPath: undefined }
        )
) {
    const { className, canRemove, nodes, callbacks, helmValuesPath } = props;

    const { onRemove, onChange } = callbacks;

    const getOnRemove_child = useCallbackFactory(([index]: [number]) => {
        assert(canRemove);
        onRemove({ helmValuesPath, index });
    });

    const getOnChange_checkbox = useCallbackFactory(
        ([helmValuesPathStr]: [string], [value]: [boolean]) =>
            onChange({
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
            onChange({
                "fieldType": "yaml code block",
                "helmValuesPath": JSON.parse(helmValuesPathStr),
                value
            })
    );

    const getOnChange_number = useCallbackFactory(
        ([helmValuesPathStr]: [string], [value]: [number]) =>
            onChange({
                "fieldType": "number field",
                "helmValuesPath": JSON.parse(helmValuesPathStr),
                value
            })
    );

    const getOnChange_select = useCallbackFactory(
        ([helmValuesPathStr]: [string], [selectedOptionIndex]: [number]) =>
            onChange({
                "fieldType": "select",
                "helmValuesPath": JSON.parse(helmValuesPathStr),
                selectedOptionIndex
            })
    );

    const getOnChange_text = useCallbackFactory(
        ([helmValuesPathStr]: [string], [value]: [string]) =>
            onChange({
                "fieldType": "text field",
                "helmValuesPath": JSON.parse(helmValuesPathStr),
                value
            })
    );

    const getOnChange_slider = useCallbackFactory(
        ([helmValuesPathStr]: [string], [value]: [number]) =>
            onChange({
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
            onChange({
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

    const { cx, classes } = useStyles_inner();

    return (
        <div className={cx(classes.root, className)}>
            {nodes.map((node, index) => {
                const key = JSON.stringify(
                    node.type === "field" && node.fieldType === "range slider"
                        ? [
                              ...node.lowEndRange.helmValuesPath,
                              ...node.highEndRange.helmValuesPath
                          ]
                        : node.helmValuesPath
                );

                if (node.type === "group") {
                    return (
                        <FormFieldGroupComponent
                            key={key}
                            className={classes.group}
                            description={node.description}
                            helmValuesPath={node.helmValuesPath}
                            nodes={node.nodes}
                            canAdd={node.canAdd}
                            canRemove={node.canRemove}
                            callbacks={callbacks}
                        />
                    );
                }

                const onRemove_child = canRemove ? getOnRemove_child(index) : undefined;

                switch (node.fieldType) {
                    case "checkbox":
                        return (
                            <CheckboxFormField
                                key={key}
                                title={node.title}
                                description={node.description}
                                isReadonly={node.isReadonly}
                                onRemove={onRemove_child}
                                value={node.value}
                                onChange={getOnChange_checkbox(
                                    JSON.stringify(node.helmValuesPath)
                                )}
                            />
                        );
                    case "yaml code block":
                        return (
                            <YamlCodeBlockFormField
                                key={key}
                                title={node.title}
                                description={node.description}
                                expectedDataType={node.expectedDataType}
                                onRemove={onRemove_child}
                                value={node.value}
                                onChange={getOnChange_yamlCodeBlock(
                                    JSON.stringify(node.helmValuesPath)
                                )}
                            />
                        );
                    case "number field":
                        return (
                            <NumberFormField
                                key={key}
                                title={node.title}
                                isReadonly={node.isReadonly}
                                description={node.description}
                                isInteger={node.isInteger}
                                minimum={node.minimum}
                                onRemove={onRemove_child}
                                value={node.value}
                                onChange={getOnChange_number(
                                    JSON.stringify(node.helmValuesPath)
                                )}
                            />
                        );
                    case "select":
                        return (
                            <SelectFormField
                                key={key}
                                title={node.title}
                                description={node.description}
                                isReadonly={node.isReadonly}
                                options={node.options}
                                onRemove={onRemove_child}
                                selectedOptionIndex={node.selectedOptionIndex}
                                onSelectedOptionIndexChange={getOnChange_select(
                                    JSON.stringify(node.helmValuesPath)
                                )}
                            />
                        );
                    case "text field":
                        return (
                            <TextFormField
                                key={key}
                                className={classes.field_text}
                                title={node.title}
                                description={node.description}
                                isReadonly={node.isReadonly}
                                doRenderAsTextArea={node.doRenderAsTextArea}
                                isSensitive={node.isSensitive}
                                pattern={node.pattern}
                                onRemove={onRemove_child}
                                value={node.value}
                                onChange={getOnChange_text(
                                    JSON.stringify(node.helmValuesPath)
                                )}
                            />
                        );
                    case "slider":
                        return (
                            <SliderFormField
                                key={key}
                                className={classes.field_slider}
                                title={node.title}
                                description={node.description}
                                isReadonly={node.isReadonly}
                                min={node.min}
                                max={node.max}
                                unit={node.unit}
                                step={node.step}
                                onRemove={onRemove_child}
                                value={node.value}
                                onChange={getOnChange_slider(
                                    JSON.stringify(node.helmValuesPath)
                                )}
                            />
                        );
                    case "range slider":
                        return (
                            <RangeSliderFormField
                                key={key}
                                className={classes.field_slider}
                                title={node.title}
                                unit={node.unit}
                                step={node.step}
                                lowEndRange={{
                                    "isReadonly": node.lowEndRange.isReadonly,
                                    "rangeEndSemantic": node.lowEndRange.rangeEndSemantic,
                                    "min": node.lowEndRange.min,
                                    "max": node.lowEndRange.max,
                                    "description": node.lowEndRange.description,
                                    "value": node.lowEndRange.value
                                }}
                                highEndRange={{
                                    "isReadonly": node.highEndRange.isReadonly,
                                    "rangeEndSemantic":
                                        node.highEndRange.rangeEndSemantic,
                                    "min": node.highEndRange.min,
                                    "max": node.highEndRange.max,
                                    "description": node.highEndRange.description,
                                    "value": node.highEndRange.value
                                }}
                                onChange={getOnChange_rangeSlider(
                                    JSON.stringify(node.lowEndRange.helmValuesPath),
                                    JSON.stringify(node.highEndRange.helmValuesPath)
                                )}
                            />
                        );
                }
            })}
        </div>
    );
}

const useStyles_inner = tss
    .withName({ FormFieldGroupComponentInner })
    .create(({ theme }) => {
        const gap = theme.spacing(6);

        return {
            "root": {
                "display": "flex",
                "flexWrap": "wrap",
                gap
            },
            "group": {
                "flex": "0 0 100%"
            },
            "field_text": {
                "flex": "0 0 300px"
            },
            "field_slider": {
                "flex": `0 0 calc(50% - ${gap / 2}px)`,
                "boxSizing": "border-box"
            }
        };
    });
