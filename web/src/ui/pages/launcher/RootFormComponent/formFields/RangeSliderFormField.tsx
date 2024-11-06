import { memo, useId } from "react";
import { FormFieldWrapper } from "./shared/FormFieldWrapper";
import { useFormField } from "./shared/useFormField";
import { RangeSlider } from "onyxia-ui/RangeSlider";
import { capitalize } from "tsafe/capitalize";
import { same } from "evt/tools/inDepth/same";

export type Props = {
    className?: string;
    title: string;
    unit: string | undefined;
    step: number | undefined;
    lowEndRange: Props.RangeEnd;
    highEndRange: Props.RangeEnd;
    onChange: (params: { lowEndRangeValue: number; highEndRangeValue: number }) => void;
};

export namespace Props {
    export type RangeEnd = {
        isReadonly: boolean;
        rangeEndSemantic: string | undefined;
        min: number;
        max: number;
        description: string | undefined;
        value: number;
    };
}

export const RangeSliderFormField = memo((props: Props) => {
    const { className, title, unit, step, lowEndRange, highEndRange, onChange } = props;

    const serialize = ([lowEndRangeValue, highEndRangeValue]: [number, number]) =>
        JSON.stringify([lowEndRangeValue, highEndRangeValue]);

    const { serializedValue, setSerializedValue, resetToDefault } = useFormField<
        [number, number],
        string,
        never
    >({
        serializedValue: serialize([lowEndRange.value, highEndRange.value]),
        throttleDelay: 500,
        onChange: ([lowEndRangeValue, highEndRangeValue]) =>
            onChange({ lowEndRangeValue, highEndRangeValue }),
        parse: serializedValue => ({
            isValid: true,
            value: JSON.parse(serializedValue) as [number, number]
        })
    });

    const inputId = useId();

    const [lowEndRangeValue, highEndRangeValue] = JSON.parse(serializedValue) as [
        number,
        number
    ];

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
            onResetToDefault={resetToDefault}
            inputId={inputId}
            onRemove={undefined}
        >
            <RangeSlider
                inputId={inputId}
                className={className}
                lowExtremitySemantic={lowEndRange.rangeEndSemantic}
                min={lowEndRange.min}
                max={highEndRange.max}
                step={step ?? 1}
                valueLow={lowEndRangeValue}
                valueHigh={highEndRangeValue}
                unit={unit ?? ""}
                highExtremitySemantic={highEndRange.rangeEndSemantic}
                onValueChange={({ valueLow, valueHigh }) =>
                    setSerializedValue(serialize([valueLow, valueHigh]))
                }
            />
        </FormFieldWrapper>
    );
}, same);
