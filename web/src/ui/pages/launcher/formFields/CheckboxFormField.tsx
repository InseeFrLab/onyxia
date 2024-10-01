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
    value: boolean;
    onChange: (newValue: boolean) => void;
};

export const CheckboxFormField = memo((props: Props) => {
    const { className, title, description, isReadonly, value, onChange } = props;

    const { serializedValue, setSerializedValue, resetToDefault } = useFormField<
        boolean,
        boolean,
        never
    >({
        "serializedValue": value,
        onChange,
        "parse": serializedValue => ({
            "isValid": true,
            "value": serializedValue
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
    "switchWrapper": {
        "width": "100%",
        "display": "flex",
        "alignItems": "center",
        "justifyContent": "center"
    }
});
