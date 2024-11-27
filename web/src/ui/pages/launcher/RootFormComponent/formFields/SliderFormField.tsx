import { memo, useId } from "react";
import { FormFieldWrapper } from "./shared/FormFieldWrapper";
import { useFormField } from "./shared/useFormField";
import Slider from "@mui/material/Slider";
import { assert } from "tsafe/assert";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";

type Props = {
    className?: string;
    title: string;
    description: string | undefined;
    isReadonly: boolean;
    min: number;
    max: number;
    unit: string | undefined;
    step: number | undefined;
    onRemove: (() => void) | undefined;
    value: number;
    onChange: (newValue: number) => void;
    isHidden: boolean;
};

export const SliderFormField = memo((props: Props) => {
    const {
        className,
        title,
        description,
        isReadonly,
        min,
        max,
        unit = "",
        step,
        onRemove,
        value,
        onChange,
        isHidden
    } = props;

    const { serializedValue, setSerializedValue, resetToDefault } = useFormField<
        number,
        number,
        never
    >({
        throttleDelay: 500,
        serializedValue: value,
        onChange,
        parse: serializedValue => ({
            isValid: true,
            value: serializedValue
        })
    });

    const inputId = useId();

    const { classes } = useStyles();

    return (
        <FormFieldWrapper
            className={className}
            title={title}
            description={description}
            error={undefined}
            onResetToDefault={resetToDefault}
            inputId={inputId}
            onRemove={onRemove}
            isHidden={isHidden}
        >
            <div>
                <div className={classes.valueWrapper}>
                    <Text typo="label 1">
                        {serializedValue}
                        {unit}
                    </Text>
                </div>
                {min !== max && (
                    <>
                        <Slider
                            id={inputId}
                            value={serializedValue}
                            disabled={isReadonly}
                            onChange={(...[, newValue]) => {
                                assert(typeof newValue === "number");
                                setSerializedValue(newValue);
                            }}
                            min={min}
                            max={max}
                            step={step}
                            marks={step === 1 && max - min < 10}
                        />
                        <div className={classes.labelWrapper}>
                            <Text className={classes.bound} typo="label 2">
                                {min}
                                {unit}
                            </Text>
                            <Text className={classes.bound} typo="label 2">
                                {max}
                                {unit}
                            </Text>
                        </div>
                    </>
                )}
            </div>
        </FormFieldWrapper>
    );
});

const useStyles = tss.withName({ SliderFormField }).create(({ theme }) => ({
    valueWrapper: {
        display: "flex",
        justifyContent: "center",
        marginBottom: theme.spacing(2)
    },
    labelWrapper: {
        display: "flex",
        justifyContent: "space-between"
    },
    bound: {
        color: theme.colors.useCases.typography.textSecondary
    }
}));
