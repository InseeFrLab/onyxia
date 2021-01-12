

import { useState, useCallback } from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiTextField from "@material-ui/core/TextField";
import type { TextFieldClassKey } from "@material-ui/core/TextField";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";
import { useCommonInputLogic } from "./useCommonInputLogic";
import { Props as CommonProps, defaultProps as defaultCommonProps } from "./useCommonInputLogic";

export type TextFieldProps = CommonProps & {
    label?: React.ReactNode;
};

const defaultProps: Optional<TextFieldProps> = {
    "label": null,
    ...defaultCommonProps,
};

const useStyles = makeStyles(
    () => createStyles<Id<TextFieldClassKey, "root">, Required<TextFieldProps> & { error: boolean; }>({
        "root": ({ error })=>({
            ...(error? {
                "position": "relative",
                "top": "8px"
            }:{})
        })
    })
);

export function TextField(props: TextFieldProps) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { label, onValueBeingTypedChange, ...completedCommonProps } = completedProps;

    const [helperText, setHelperText] = useState<string | undefined>(undefined);

    const commonMuiProps = useCommonInputLogic({
        ...completedCommonProps,
        "onValueBeingTypedChange": useCallback(
            (params: Parameters<NonNullable<CommonProps["onValueBeingTypedChange"]>>[0]) => {

                setHelperText(
                    params.isValidValue ?
                        "" : params.message
                );

                return onValueBeingTypedChange(params);

            },
            [onValueBeingTypedChange]
        )
    });

    const classes = useStyles({ 
        ...completedProps, 
        "error": commonMuiProps.error 
    });

    return (
        <MuiTextField
            {...commonMuiProps}
            {...{
                classes,
                label,
                helperText
            }}
        />
    );

}
