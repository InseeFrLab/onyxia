
import React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiTypography from "@material-ui/core/Typography";
import type { TypographyClassKey } from "@material-ui/core/Typography";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type Props = {
    className?: string | null;
    variant?: "h2" | "subtitle1" | "body1" | "h3" | "h6";
    children: NonNullable<React.ReactNode>;
    color?: "initial" | "inherit" | "textPrimary" | "textSecondary"
    style?: React.CSSProperties | null;
};

export const defaultProps: Optional<Props> = {
    "className": null,
    "variant": "body1",
    "color": "initial",
    "style": null
};


const useStyles = makeStyles(
    () => createStyles<Id<TypographyClassKey, "root">, Required<Props>>({
        "root": {
        }
    })
);


export function Typography(props: Props) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { children, variant, className, color, style } = completedProps;

    const classes = useStyles(completedProps);

    return (
        <MuiTypography
            className={className ?? undefined}
            classes={classes}
            variant={variant}
            color={color}
            style={style ?? undefined}
        >
            {children}
        </MuiTypography>
    );

}






