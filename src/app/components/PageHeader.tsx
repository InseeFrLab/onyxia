
import React from "react";
import { Typography } from "app/components/designSystem/Typography";
import { Props as AppIconProps }  from "./designSystem/Icon";
import { Icon } from "./designSystem/Icon";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import type { Optional } from "evt/tools/typeSafety";
import Box from "@material-ui/core/Box";
import { noUndefined } from "app/utils/noUndefined";
import clsx from "clsx";

export type Props = {
    icon: AppIconProps["type"];
    text1: NonNullable<React.ReactNode>;
    text2: NonNullable<React.ReactNode>;
    text3: NonNullable<React.ReactNode>;
    className?: string | null;

};

export const defaultProps: Optional<Props> = {
    "className": null,
};

const useStyles = makeStyles(
    theme => createStyles<"root" | "text1" | "text2" | "icon", Required<Props>>({
        "root": {
            "backgroundColor": "inherit",
            "padding": theme.spacing(5),
            "paddingLeft": theme.spacing(3)
        },
        "text1": {
            "marginBottom": theme.spacing(3),
            //"border": "1px solid black",
            "display": "flex",
            "alignItems": "center"
        },
        "icon": {
            "marginRight": theme.spacing(2),
            "position": "relative",
            //"border": "1px solid black",
            "fontSize": 46
        },
        "text2": {
            "marginBottom": theme.spacing(1)
        }
    })
);

export function PageHeader(props: Props) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { icon, text1, text2, text3, className  } = completedProps;

    const classes = useStyles(completedProps);

    return (
        <Box className={clsx(classes.root, className)}>
            <Typography variant="h2" className={classes.text1}>
                <Icon type={icon} fontSize="large" className={classes.icon} />
                {/* //TODO: Address the fact that our font does not have the same box size*/}
                <span style={{ "paddingTop": "6px", /*"border": "1px solid black"*/ }}>{text1}</span>
            </Typography>
            <Typography variant="h5" className={classes.text2}>{text2}</Typography>
            <Typography variant="body1">{text3}</Typography>
        </Box>
    );

}

