
import { createUseClassNames, cx, css } from "app/theme/useClassNames";
import MuiButton from "@material-ui/core/Button";
import type { Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";
import type { Props as IconProps } from "./Icon";
import { Icon } from "./Icon";
import { useWithProps } from "app/utils/hooks/useWithProps";

export type Props = {

    className?: string | null;

    color?: "primary" | "secondary";
    /** can be optional with an icon */
    children?: React.ReactNode;
    disabled?: boolean;
    onClick: () => void;

    startIcon?: IconProps["type"] | null;
    endIcon?: IconProps["type"] | null;

    autoFocus?: boolean;



};

export const defaultProps: Optional<Props> = {
    "className": null,
    "color": "primary",
    "disabled": false,
    "children": null,
    "startIcon": null,
    "endIcon": null,
    "autoFocus": false
};

const { useClassNames } = createUseClassNames<Required<Props>>()(
    ({ theme }, { color, disabled }) => {

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
                    "borderRadius":  20,
                    "borderWidth": "2px",
                    "borderStyle": "solid",
                    "borderColor": disabled ? "transparent" : hoverBackgroundColor,
                    "padding": theme.spacing(1, 2),
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

export function Button(props: Props) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { className, color, disabled, children, onClick, startIcon, endIcon, autoFocus } = completedProps;

    const { classNames } = useClassNames(completedProps);

    const ColoredIcon = useWithProps(
        Icon,
        {
            "color": disabled ? "textDisabled" : "textPrimary",
            "fontSize": "inherit",
            "className": classNames.icon
        }
    );

    return (

        <MuiButton
            className={cx(classNames.root, className)}
            color={color}
            disabled={disabled}
            onClick={onClick}
            startIcon={startIcon === null ? undefined : <ColoredIcon type={startIcon} />}
            endIcon={endIcon === null ? undefined : <ColoredIcon type={endIcon} />}
            autoFocus={autoFocus}
        >
            {/* TODO: Put text in label props or address the problem globally, see the todo in page header */}
            <span className={css({ "paddingTop": "2px" })} >
                {children}
            </span>
        </MuiButton>
    );

}






