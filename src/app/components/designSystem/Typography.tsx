

import React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiTypography from "@material-ui/core/Typography";
import type { TypographyClassKey } from "@material-ui/core/Typography";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";
import type { InterpolationWithTheme } from "@emotion/core";

export type Props = {
    className?: string | null;
    variant?: "h1" | "h2" | "h3" |"h4" | "h5" | "h6" | "subtitle1" | "body1" | "caption";
    color?: "primary" | "secondary" | "disabled" | "focus"
    style?: React.CSSProperties | null;
    children: NonNullable<React.ReactNode>;
    onClick?: (() => void) | null;
    css?: InterpolationWithTheme<any> | null;
};

export const defaultProps: Optional<Props> = {
    "className": null,
    "variant": "body1",
    "color": "primary",
    "style": null,
    "onClick": null,
    "css": null
};




const useStyles = makeStyles(
    theme => createStyles<Id<TypographyClassKey, "root">, Required<Props>>({
        "root": ({ color, onClick }) => ({
            "color": theme.custom.colors.useCases.typography[(()=>{
                switch(color){
                    case "primary": return "textPrimary";
                    case "secondary": return "textSecondary";
                    case "disabled": return "textDisabled";
                    case "focus": return "textFocus";
                }
            })()],
            "cursor": onClick !== null ?  "pointer" : undefined
        })
    })
);

export const Typography = React.forwardRef<any, Props>((props, ref) => {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { 
        children, variant, className, style, 
        //For the forwarding, rest should be empty (typewise)
        color,
        onClick,
        css,
        ...rest 
    } = completedProps;

    const classes = useStyles(completedProps);

    return (
        <MuiTypography
            css={css}
            ref={ref}
            className={className ?? undefined}
            classes={classes}
            variant={variant}
            style={style ?? undefined}
            onClick={onClick ?? undefined}
            {...rest}
        >
            {children}
        </MuiTypography>
    );

});






