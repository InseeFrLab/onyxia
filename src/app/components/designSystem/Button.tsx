
import { useMemo } from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiButton from "@material-ui/core/Button";
import type { ButtonClassKey } from "@material-ui/core/Button";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";
import type { Props as IconProps } from "./Icon";
import { Icon } from "./Icon";
import { withProps } from "app/utils/withProps";


export type Props = {

    className?: string | null;

    color?: "primary" | "secondary";
    /** can be optional with an icon */
    children?: React.ReactNode;
    disabled?: boolean;
    onClick: () => void;

    startIcon?: IconProps["type"] | null;
    endIcon?: IconProps["type"] | null;

    isRounded?: boolean;

};

export const defaultProps: Optional<Props> = {
    "className": null,
    "color": "primary",
    "disabled": false,
    "children": null,
    "isRounded": true,
    "startIcon": null,
    "endIcon": null
};


const useStyles = makeStyles(
    theme => {

        const textColor = ({ color, disabled }: Pick<Required<Props>, "color" | "disabled">) =>
            disabled ?
                theme.custom.colors.useCases.typography.textDisabled :
                theme.custom.colors.useCases.typography[(() => {
                    switch (color) {
                        case "primary": return "textFocus";
                        case "secondary": return "textPrimary";
                    }
                })()];

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


        return createStyles<Id<ButtonClassKey | "icon", "root" | "text" | "icon">, Required<Props>>({
            "root": ({ isRounded, color, disabled }) => {

                const hoverBackgroundColor = theme.custom.colors.useCases.buttons[
                    (() => {
                        switch (color) {
                            case "primary": return "actionHoverPrimary";
                            case "secondary": return "actionHoverSecondary";
                        }
                    })()
                ];

                return {
                    "backgroundColor": isRounded && disabled ? 
                        theme.custom.colors.useCases.buttons.actionDisabledBackground : 
                        "transparent",
                    "borderRadius": isRounded ? 20 : undefined,
                    "border": `2px solid ${!isRounded || disabled ? "transparent" : hoverBackgroundColor}`,
                    "padding": theme.spacing(1, 2),
                    "&:hover": { backgroundColor: hoverBackgroundColor },
                    /*
                    "&:active .MuiSvgIcon-root": {
                        "color": theme.custom.colors.useCases.typography.textFocus
                    },
                    */
                    "&:hover .MuiSvgIcon-root": {
                        "color": hoverTextColor({ color, disabled }),
                    }
                };


            },
            "text": ({ color, disabled }) => ({
                "color": textColor({ color, disabled }),
                "&:hover": {
                    "color": hoverTextColor({ color, disabled }),
                }
            }),
            "icon": ({ color, disabled }) => ({
                "color": textColor({ color, disabled })
            })
        });

    }
);


export function Button(props: Props) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { color, disabled, children, onClick, startIcon, endIcon, className } = completedProps;

    const classes = useStyles(completedProps);

    const ColoredIcon = useMemo(
        () => withProps(
            Icon,
            {
                "color": disabled ? "textDisabled" : "textPrimary",
                "fontSize": "inherit",
                "className": classes.icon
            }
        ),
        [disabled, classes]
    );

    return (
        <MuiButton
            className={className ?? undefined}
            classes={classes}
            color={color}
            disabled={disabled}
            onClick={onClick}
            startIcon={startIcon === null ? undefined :

                <ColoredIcon
                    type={startIcon}
                />
            }
            endIcon={endIcon === null ? undefined :
                <ColoredIcon type={endIcon} />
            }
        >
            {/* TODO: Put text in label props or address the problem globally, see the todo in page header */}
            <span style={{ "paddingTop": "2px" }}>
                {children}
            </span>
        </MuiButton>
    );

}






