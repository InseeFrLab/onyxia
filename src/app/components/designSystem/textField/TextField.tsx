
import { createUseClassNames } from "app/theme/useClassNames";
import { cx } from "tss-react";
import { useState, memo } from "react";
import { useConstCallback } from "powerhooks";
import MuiTextField from "@material-ui/core/TextField";
import type { Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/tools/noUndefined";
import { useCommonInputLogic } from "./useCommonInputLogic";
import { Props as CommonProps, defaultProps as defaultCommonProps } from "./useCommonInputLogic";
import { useRef, useEffect } from "react";

export type TextFieldProps = CommonProps & {
    label?: React.ReactNode;
};

export const defaultProps: Optional<TextFieldProps> = {
    "label": null,
    ...defaultCommonProps,
};

const { useClassNames } = createUseClassNames<Required<TextFieldProps> & { error: boolean; }>()(
    (theme, { error }) => ({
        "root": {
            ...(error ? {
                "position": "relative",
                "top": "8px",
            } : {}),
            "&:focus": {
                "outline": "unset",
            },
            "& input:-webkit-autofill": {
                "-webkit-text-fill-color":
                    theme.palette.text[(() => {
                        switch (theme.palette.type) {
                            case "dark": return "primary";
                            case "light": return "secondary";
                        }
                    })()],
                "-webkit-box-shadow": `0 0 0 1000px ${theme.custom.colors.useCases.surfaces.surfaces} inset`,
            }

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


    // See: https://github.com/InseeFrLab/onyxia-ui/issues/215#issuecomment-812895211
    // this is why we remove the value attribute when empty.
    const ref = useRef<HTMLDivElement>(null);

    useEffect(
        () => {

            if (commonMuiProps.value !== "") {
                return;
            }
            ref.current!.querySelector("input")?.removeAttribute("value");
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    return (
        <MuiTextField
            ref={ref}
            {...commonMuiProps}
            {...{
                label,
                helperText
            }}
            className={cx(classNames.root, className)}
        />
    );

});
