
import { createUseClassNames, cx } from "app/theme/useClassNames";
import { useState, memo } from "react";
import { useConstCallback } from "app/tools/hooks/useConstCallback";
import MuiTextField from "@material-ui/core/TextField";
import type { Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/tools/noUndefined";
import { useCommonInputLogic } from "./useCommonInputLogic";
import { Props as CommonProps, defaultProps as defaultCommonProps } from "./useCommonInputLogic";

export type TextFieldProps = CommonProps & {
    label?: React.ReactNode;
};

const defaultProps: Optional<TextFieldProps> = {
    "label": null,
    ...defaultCommonProps,
};

const { useClassNames } = createUseClassNames<Required<TextFieldProps> & { error: boolean; }>()(
    (...[, { error }]) => ({
        "root": {
            ...(error ? {
                "position": "relative",
                "top": "8px"
            } : {})
        }
    })
);

export const TextField = memo((props: TextFieldProps) => {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { label, onValueBeingTypedChange, ...completedCommonProps } = completedProps;

    const [helperText, setHelperText] = useState<string | undefined>(undefined);

    const { className, ...commonMuiProps } = useCommonInputLogic({
        ...completedCommonProps,
        "onValueBeingTypedChange": useConstCallback(
            (params: Parameters<NonNullable<CommonProps["onValueBeingTypedChange"]>>[0]) => {

                setHelperText(
                    params.isValidValue ?
                        "" : params.message
                );

                return onValueBeingTypedChange(params);

            }
        )
    });

    const { classNames } = useClassNames({
        ...completedProps,
        "error": commonMuiProps.error
    });

    return (
        <MuiTextField
            {...commonMuiProps}
            {...{
                label,
                helperText
            }}
            className={cx(classNames.root, className)}
        />
    );

});
