import { useMemo, memo } from "react";
import Slider from "@material-ui/core/Slider";
import type { SliderProps } from "@material-ui/core/Slider";
import { assert } from "tsafe/assert";
import { is } from "tsafe/is";
import { useConstCallback } from "powerhooks/useConstCallback";
import { Text, makeStyles } from "app/theme";
import type { ReactNode } from "react";

export type DoubleSliderProps = {
    className?: string;
    label: NonNullable<ReactNode>;
    min: number;
    max: number;
    step: number;
    valueDown: number;
    valueUp: number;
    setValueDown(valueDown: number): void;
    setValueUp(valueUp: number): void;
    formatValueLabelOrUnit?:
        | ((props: { value: number; bound: "up" | "down" }) => string)
        | string;
};

const useStyles = makeStyles()(theme => ({
    "root": {
        "& .MuiSlider-root": {},
        "& .MuiSlider-valueLabel": {
            "& .PrivateValueLabel-label-15": {},
        },
    },
}));

export const DoubleSlider = memo((props: DoubleSliderProps) => {
    const {
        className,
        label,
        min,
        max,
        step,
        valueDown,
        valueUp,
        setValueDown,
        setValueUp,
        formatValueLabelOrUnit,
    } = props;

    const { classes, cx } = useStyles();

    const sliderValue = useMemo(() => {
        assert(
            valueDown <= valueUp,
            "DoubleSlider error, valueDown must always be inferior or equal to upperRange",
        );

        return [valueDown, valueUp];
    }, [valueDown, valueUp]);

    const onChange = useConstCallback<SliderProps["onChange"]>((...[, value]: any[]) => {
        assert(is<[number, number]>(value));

        const [newValueDown, newValueUp] = value;

        if (newValueDown !== valueDown) {
            setValueDown(newValueDown);
        }

        if (newValueUp !== valueUp) {
            setValueUp(newValueUp);
        }
    });

    const textComponentProps = useMemo(
        () => ({
            "id": Math.random() + "",
        }),
        [label],
    );

    return (
        <div className={cx(classes.root, className)}>
            <Text typo="label 2" componentProps={textComponentProps}>
                {label}
            </Text>
            <Slider
                className={className}
                value={sliderValue}
                onChange={onChange}
                valueLabelFormat={(value, index) => {
                    if (formatValueLabelOrUnit === undefined) {
                        return `${value}`;
                    }

                    if (typeof formatValueLabelOrUnit === "string") {
                        return `${value} ${formatValueLabelOrUnit}`;
                    }

                    assert(is<0 | 1>(index));

                    return formatValueLabelOrUnit({
                        value,
                        "bound": (() => {
                            switch (index) {
                                case 0:
                                    return "down";
                                case 1:
                                    return "up";
                            }
                        })(),
                    });
                }}
                step={step}
                marks
                min={min}
                max={max}
                valueLabelDisplay="auto"
                aria-labelledby={textComponentProps.id}
            />
        </div>
    );
});
