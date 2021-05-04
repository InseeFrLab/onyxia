
import { forwardRef, memo } from "react";
import { createUseClassNames } from "app/theme/useClassNames";
import { cx } from "tss-react";
import MuiButton from "@material-ui/core/Button";
import type { Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/tools/noUndefined";
import type { Props as IconProps } from "./Icon";
import { Icon } from "./Icon";
import { useGuaranteedMemo } from "powerhooks";

export type Props = {

    className?: string | null;

    color?: "primary" | "secondary";
    /** can be optional with an icon */
    children?: React.ReactNode;
    disabled?: boolean;
    onClick?(): void;

    startIcon?: IconProps["type"] | null;
    endIcon?: IconProps["type"] | null;

    autoFocus?: boolean;

    type?: "button" | "submit"

    tabIndex?: number | null;

    name?: string | null;
    id?: string | null;



};

export const defaultProps: Optional<Props> = {
    "className": null,
    "color": "primary",
    "disabled": false,
    "children": null,
    "startIcon": null,
    "endIcon": null,
    "autoFocus": false,
    "type": "button",
    "onClick": ()=>{},
    "tabIndex": null,
    "name": null,
    "id": null
};

const { useClassNames } = createUseClassNames<Required<Props>>()(
    (theme, { color, disabled }) => {

        const textColor = ({ color, disabled }: Pick<Required<Props>, "color" | "disabled">) =>
            theme.custom.colors.useCases.typography[
            disabled ?
                "textDisabled" :
                (() => {
                    switch (color) {
                        case "primary": return "textFocus";
                        case "secondary": return "textPrimary";
                    }
                })()
            ];

        const hoverTextColor = ({ color }: Pick<Required<Props>, "color" | "disabled">) => {
            switch (theme.palette.type) {
                case "dark":
                    return theme.custom.colors.palette[(() => {
                        switch (color) {
                            case "primary": return "whiteSnow";
                            case "secondary": return "midnightBlue";
                        }
                    })()].main;
                case "light": return theme.custom.colors.palette.whiteSnow.main;
            }
        };


        return {
            "root": (() => {

                const hoverBackgroundColor = theme.custom.colors.useCases.buttons[
                    (() => {
                        switch (color) {
                            case "primary": return "actionHoverPrimary";
                            case "secondary": return "actionHoverSecondary";
                        }
                    })()
                ];

                return {
                    "backgroundColor": disabled ?
                        theme.custom.colors.useCases.buttons.actionDisabledBackground :
                        "transparent",
                    "height": 36,
                    "borderRadius":  20,
                    "borderWidth": "2px",
                    "borderStyle": "solid",
                    "borderColor": disabled ? "transparent" : hoverBackgroundColor,
                    "padding": theme.spacing(0, 2),
                    "&.MuiButton-text": {
                        "color": textColor({ color, disabled })
                    },
                    "&:hover": {
                        "backgroundColor": hoverBackgroundColor,
                        "& .MuiSvgIcon-root": {
                            "color": hoverTextColor({ color, disabled }),
                        },
                        "&.MuiButton-text": {
                            "color": hoverTextColor({ color, disabled }),
                        }
                    }
                };

            })(),
            "icon": {
                "color": textColor({ color, disabled })
            }
        };

    }
);

export const Button = memo(forwardRef<HTMLButtonElement, Props>((props, ref) => {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { 
        className, color, disabled, children, 
        onClick, startIcon, endIcon, autoFocus, 
        type, tabIndex, name, id,
        //For the forwarding, rest should be empty (typewise)
        ...rest
    } = completedProps;

    const { classNames } = useClassNames(completedProps);

    const IconWd = useGuaranteedMemo(
        () =>
            (props: { type: IconProps["type"]; }) =>
                <Icon
                    color={disabled ? "textDisabled" : "textPrimary"}
                    fontSize="inherit"
                    className={classNames.icon}
                    type={props.type}
                />
        ,
        [disabled, classNames.icon]
    );


    return (
        <MuiButton
            ref={ref}
            className={cx(classNames.root, className)}
            color={color}
            disabled={disabled}
            onClick={onClick}
            startIcon={startIcon === null ? undefined : <IconWd type={startIcon} />}
            endIcon={endIcon === null ? undefined : <IconWd type={endIcon} />}
            autoFocus={autoFocus}
            type={type}
            tabIndex={tabIndex ?? undefined}
            name={name ?? undefined}
            id={id ?? undefined}
            {...rest}
        >
            {children}
        </MuiButton>
    );

}));






