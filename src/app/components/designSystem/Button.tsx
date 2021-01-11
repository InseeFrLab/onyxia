
import React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiButton from "@material-ui/core/Button";
import type { ButtonClassKey } from "@material-ui/core/Button";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";
import type { Props as IconProps } from "./Icon";
import { Icon } from "./Icon";

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
    theme => createStyles<Id<ButtonClassKey, "root" | "text">, Required<Props>>({
        "root": ({ isRounded, color }) => {

            const backgroundColor = theme.custom.colors.useCases.buttons[
                (() => {
                    switch (color) {
                        case "primary": return "actionHoverPrimary";
                        case "secondary": return "actionHoverSecondary";
                    }
                })()
            ];

            return {
                "borderRadius": isRounded ? 20 : undefined,
                "border": !isRounded ? undefined :
                    `2px solid ${backgroundColor}`,
                "padding": theme.spacing(1, 2),
                "&:hover": { backgroundColor },
            };

        },
        "text": ({ color }) => ({
            "&:hover": {
                "color": (() => {
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
                })()
            }

        })
    })
);


export function Button(props: Props) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { color, disabled, children, onClick, startIcon, endIcon, className } = completedProps;

    const classes = useStyles(completedProps);

    return (
        <MuiButton
            className={className ?? undefined}
            classes={classes}
            color={color}
            disabled={disabled}
            onClick={onClick}
            startIcon={startIcon === null ? undefined : <Icon type={startIcon} />}
            endIcon={endIcon === null ? undefined : <Icon type={endIcon} />}
        >
            {children}
        </MuiButton>
    );

}






