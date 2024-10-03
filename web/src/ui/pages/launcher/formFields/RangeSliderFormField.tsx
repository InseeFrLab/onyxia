import { memo, useId } from "react";
import { FormFieldWrapper } from "./shared/FormFieldWrapper";
import { useFormField } from "./shared/useFormField";
import { RangeSlider } from "onyxia-ui/RangeSlider";
import { capitalize } from "tsafe/capitalize";

export type Props = {
    className?: string;
    title: string;
    unit: string | undefined;
    step: number | undefined;
    lowEndRange: Props.RangeEnd;
    highEndRange: Props.RangeEnd;
};

export namespace Props {
    export type RangeEnd = {
        isReadonly: boolean;
        rangeEndSemantic: string | undefined;
        min: number;
        max: number;
        description: string | undefined;
        value: number;
        onChange: (newValue: number) => void;
    };
}

export const RangeSliderFormField = memo((props: Props) => {
    const { className, title, unit, step, lowEndRange, highEndRange } = props;

    const lowEndRangeApi = useFormField<number, number, never>({
        "serializedValue": lowEndRange.value,
        "onChange": lowEndRange.onChange,
        "parse": serializedValue => ({
            "isValid": true,
            "value": serializedValue
        })
    });

    const highEndRangeApi = useFormField<number, number, never>({
        "serializedValue": highEndRange.value,
        "onChange": highEndRange.onChange,
        "parse": serializedValue => ({
            "isValid": true,
            "value": serializedValue
        })
    });

    const inputId = useId();

    return (
        <FormFieldWrapper
            className={className}
            title={capitalize(title)}
            description={
                <>
                    {lowEndRange.description}
                    {" /"}
                    <br />
                    {highEndRange.description}
                </>
            }
            error={undefined}
            onResetToDefault={() => {
                lowEndRangeApi.resetToDefault();
                highEndRangeApi.resetToDefault();
            }}
            inputId={inputId}
        >
            <RangeSlider
                id={inputId}
                className={className}
                label=""
                lowExtremitySemantic={lowEndRange.rangeEndSemantic}
                min={lowEndRange.min}
                max={highEndRange.max}
                step={step ?? 1}
                valueLow={lowEndRangeApi.serializedValue}
                valueHigh={highEndRangeApi.serializedValue}
                unit={unit ?? ""}
                highExtremitySemantic={highEndRange.rangeEndSemantic}
                onValueChange={({ extremity, value }) => {
                    switch (extremity) {
                        case "low":
                            if (value > lowEndRange.max) {
                                return;
                            }
                            lowEndRangeApi.setSerializedValue(value);
                            break;
                        case "high":
                            if (value < highEndRange.min) {
                                return;
                            }
                            highEndRangeApi.setSerializedValue(value);
                            break;
                    }
                }}
            />
        </FormFieldWrapper>
    );
});
