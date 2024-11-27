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
import type { Stringifyable } from "core/tools/Stringifyable";
import type { FormCallbacks } from "../FormCallbacks";
import { Button } from "onyxia-ui/Button";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { getIconUrlByName } from "lazy-icons";

export type Props = {
    className?: string;
    helmValuesPath: (string | number)[];
    nodes: (FormField | FormFieldGroup)[];
    canAdd: boolean;
    canRemove: boolean;
    callbacks: FormCallbacks;
    isHidden: boolean;
};

export function FormFieldGroupComponent(props: Props) {
    const { className, canAdd, canRemove, nodes, callbacks, helmValuesPath, isHidden } =
        props;

    const { onRemove, onAdd, onChange, onFieldErrorChange } = callbacks;

    const getOnRemove_child = useCallbackFactory(([index]: [number]) => {
        onRemove({ helmValuesPath, index });
    });

    const getOnFieldErrorChange_child = useCallbackFactory(
        ([helmValuesPathStr]: [string], [params]: [{ hasError: boolean }]) => {
            const { hasError } = params;
            onFieldErrorChange({
                helmValuesPath: JSON.parse(helmValuesPathStr),
                hasError
            });
        }
    );

    const getOnChange_checkbox = useCallbackFactory(
        ([helmValuesPathStr]: [string], [value]: [boolean]) =>
            onChange({
                fieldType: "checkbox",
                helmValuesPath: JSON.parse(helmValuesPathStr),
                value
            })
    );

    const getOnChange_yamlCodeBlock = useCallbackFactory(
        (
            [helmValuesPathStr]: [string],
            [value]: [Record<string, Stringifyable> | Stringifyable[]]
        ) =>
            onChange({
                fieldType: "yaml code block",
                helmValuesPath: JSON.parse(helmValuesPathStr),
                value
            })
    );

    const getOnChange_number = useCallbackFactory(
        ([helmValuesPathStr]: [string], [value]: [number]) =>
            onChange({
                fieldType: "number field",
                helmValuesPath: JSON.parse(helmValuesPathStr),
                value
            })
    );

    const getOnChange_select = useCallbackFactory(
        ([helmValuesPathStr]: [string], [selectedOptionIndex]: [number]) =>
            onChange({
                fieldType: "select",
                helmValuesPath: JSON.parse(helmValuesPathStr),
                selectedOptionIndex
            })
    );

    const getOnChange_text = useCallbackFactory(
        ([helmValuesPathStr]: [string], [value]: [string]) =>
            onChange({
                fieldType: "text field",
                helmValuesPath: JSON.parse(helmValuesPathStr),
                value
            })
    );

    const getOnChange_slider = useCallbackFactory(
        ([helmValuesPathStr]: [string], [value]: [number]) =>
            onChange({
                fieldType: "slider",
                helmValuesPath: JSON.parse(helmValuesPathStr),
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
                fieldType: "range slider",
                highEndRange: {
                    helmValuesPath: JSON.parse(helmValuesPathStr_highEndRange),
                    value: params.highEndRangeValue
                },
                lowEndRange: {
                    helmValuesPath: JSON.parse(helmValuesPathStr_lowEndRange),
                    value: params.lowEndRangeValue
                }
            })
    );

    const { cx, classes } = useStyles({ isHidden });

    const { t } = useTranslation({ FormFieldGroupComponent });

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

                const onRemove_child = canRemove ? getOnRemove_child(index) : undefined;

                if (node.type === "group") {
                    return (
                        <FormFieldGroupComponentWrapper
                            key={key}
                            className={classes.group}
                            title={node.title}
                            onRemove={onRemove_child}
                            description={node.description}
                        >
                            <FormFieldGroupComponent
                                nodes={node.nodes}
                                callbacks={callbacks}
                                canAdd={node.canAdd}
                                canRemove={node.canRemove}
                                helmValuesPath={node.helmValuesPath}
                                isHidden={node.isHidden}
                            />
                        </FormFieldGroupComponentWrapper>
                    );
                }

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
                                isHidden={node.isHidden}
                            />
                        );
                    case "yaml code block": {
                        const helmValuesPathStr = JSON.stringify(node.helmValuesPath);
                        return (
                            <YamlCodeBlockFormField
                                key={key}
                                className={classes.field_yamlCodeBlock}
                                title={node.title}
                                description={node.description}
                                expectedDataType={node.expectedDataType}
                                onRemove={onRemove_child}
                                value={node.value}
                                onChange={getOnChange_yamlCodeBlock(helmValuesPathStr)}
                                onErrorChange={getOnFieldErrorChange_child(
                                    helmValuesPathStr
                                )}
                                isHidden={node.isHidden}
                            />
                        );
                    }
                    case "number field": {
                        const helmValuesPathStr = JSON.stringify(node.helmValuesPath);
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
                                onChange={getOnChange_number(helmValuesPathStr)}
                                onErrorChange={getOnFieldErrorChange_child(
                                    helmValuesPathStr
                                )}
                                isHidden={node.isHidden}
                            />
                        );
                    }
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
                                isHidden={node.isHidden}
                            />
                        );
                    case "text field": {
                        const helmValuesPathStr = JSON.stringify(node.helmValuesPath);
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
                                onChange={getOnChange_text(helmValuesPathStr)}
                                onErrorChange={getOnFieldErrorChange_child(
                                    helmValuesPathStr
                                )}
                                isHidden={node.isHidden}
                            />
                        );
                    }
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
                                isHidden={node.isHidden}
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
                                    isReadonly: node.lowEndRange.isReadonly,
                                    rangeEndSemantic: node.lowEndRange.rangeEndSemantic,
                                    min: node.lowEndRange.min,
                                    max: node.lowEndRange.max,
                                    description: node.lowEndRange.description,
                                    value: node.lowEndRange.value
                                }}
                                highEndRange={{
                                    isReadonly: node.highEndRange.isReadonly,
                                    rangeEndSemantic: node.highEndRange.rangeEndSemantic,
                                    min: node.highEndRange.min,
                                    max: node.highEndRange.max,
                                    description: node.highEndRange.description,
                                    value: node.highEndRange.value
                                }}
                                onChange={getOnChange_rangeSlider(
                                    JSON.stringify(node.lowEndRange.helmValuesPath),
                                    JSON.stringify(node.highEndRange.helmValuesPath)
                                )}
                                isHidden={node.isHidden}
                            />
                        );
                }
            })}
            {canAdd && (
                <Button
                    startIcon={getIconUrlByName("AddCircleOutline")}
                    variant="ternary"
                    onClick={() => onAdd({ helmValuesPath })}
                >
                    {t("add")}
                </Button>
            )}
        </div>
    );
}

const { i18n } = declareComponentKeys<"add">()({ FormFieldGroupComponent });
export type I18n = typeof i18n;

const useStyles = tss
    .withName({ FormFieldGroupComponent })
    .withParams<{ isHidden: boolean }>()
    .create(({ theme, isHidden }) => {
        const gap = theme.spacing(6);

        return {
            root: isHidden
                ? { display: "none" }
                : {
                      display: "flex",
                      flexWrap: "wrap",
                      gap,
                      alignItems: "baseline"
                  },
            group: {
                flex: "0 0 100%"
            },
            field_text: {
                flex: "0 0 300px"
            },
            field_yamlCodeBlock: {
                flex: "0 0 100%"
            },
            field_slider: {
                flex: `0 0 calc(50% - ${gap / 2}px)`,
                boxSizing: "border-box"
            }
        };
    });
