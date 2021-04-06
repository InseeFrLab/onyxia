

import { createUseClassNames } from "app/theme/useClassNames";
import { cx } from "tss-react";
import { useState, useMemo, useReducer, memo } from "react";
import { useConstCallback } from "powerhooks";
import MuiTextField from "@material-ui/core/TextField";
import type { Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/tools/noUndefined";
import { useCommonInputLogic } from "./useCommonInputLogic";
import { Props as CommonProps, defaultProps as defaultCommonProps } from "./useCommonInputLogic";
import { getBrowser } from "app/tools/getBrowser";
import InputAdornment from "@material-ui/core/InputAdornment";
import { IconButton } from "app/components/designSystem/IconButton";

export type TextFieldProps = CommonProps & {
    label?: React.ReactNode;
};

export const defaultProps: Optional<TextFieldProps> = {
    "label": null,
    ...defaultCommonProps,
};

const { useClassNames } = createUseClassNames<Required<TextFieldProps> & { error: boolean; }>()(
    (theme, { error: _error }) => ({
        "root": {
            "& .MuiFormHelperText-root": {
                "position": "absolute",
                "bottom": "-20px"
            },
            "&:focus": {
                "outline": "unset",
            },
            "& input:-webkit-autofill": {
                ...(() => {
                    switch (getBrowser()) {
                        case "chrome":
                        case "safari":
                            return {
                                "WebkitTextFillColor":
                                    theme.palette.text[(() => {
                                        switch (theme.palette.type) {
                                            case "dark": return "primary";
                                            case "light": return "secondary";
                                        }
                                    })()],
                                "WebkitBoxShadow": `0 0 0 1000px ${theme.custom.colors.useCases.surfaces.surfaces} inset`,
                            };
                        default: return {}
                    }

                })()


            }

        }
    })
);

export const TextField = memo((props: TextFieldProps) => {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { label, onValueBeingTypedChange, ...completedCommonProps } = completedProps;

    const [helperText, setHelperText] = useState<string | undefined>(undefined);

    const {
        className,
        type,
        InputProps: { endAdornment, ...InputProps },
        ...commonMuiProps
    } = useCommonInputLogic({
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

    const [isPasswordShown, toggleIsPasswordShown] = useReducer((v: boolean) => !v, false);

    return (
        <MuiTextField
            type={type !== "password" ? type : isPasswordShown ? "text" : "password"}
            //Not to confound with inputProps (with lowercase 'i')
            InputProps={useMemo(
                () => ({
                    "endAdornment":
                        endAdornment ??
                            type !== "password" ? undefined :
                            <InputAdornment position="end">
                                <IconButton
                                    type={isPasswordShown ? "visibilityOff" : "visibility"}
                                    onClick={toggleIsPasswordShown}
                                />
                            </InputAdornment>,
                    ...InputProps
                }),
                [isPasswordShown, type, InputProps, endAdornment]
            )}
            {...commonMuiProps}
            {...{
                label,
                helperText
            }}
            className={cx(classNames.root, className)}
        />
    );

});
