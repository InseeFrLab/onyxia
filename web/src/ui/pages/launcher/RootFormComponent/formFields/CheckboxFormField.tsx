import { memo, useId } from "react";
import { FormFieldWrapper } from "./shared/FormFieldWrapper";
import { useFormField } from "./shared/useFormField";
import { tss } from "tss";
import Switch from "@mui/material/Switch";

type Props = {
    className?: string;
    title: string;
    description: string | undefined;
    isReadonly: boolean;
    onRemove: (() => void) | undefined;
    value: boolean;
    onChange: (newValue: boolean) => void;
    isHidden: boolean;
};

export const CheckboxFormField = memo((props: Props) => {
    const {
        className,
        title,
        description,
        isReadonly,
        onRemove,
        value,
        onChange,
        isHidden
    } = props;

    const { serializedValue, setSerializedValue, resetToDefault } = useFormField<
        boolean,
        boolean,
        never
    >({
        serializedValue: value,
        throttleDelay: 0,
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
            <div className={classes.switchWrapper}>
                <Switch
                    id={inputId}
                    disabled={isReadonly}
                    checked={serializedValue}
                    onChange={event => setSerializedValue(event.target.checked)}
                    readOnly={isReadonly}
                />
            </div>
        </FormFieldWrapper>
    );
});

const useStyles = tss.withName({ CheckboxFormField }).create({
    switchWrapper: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    }
});
