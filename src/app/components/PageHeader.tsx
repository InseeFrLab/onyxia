
import React from "react";
import { Typography } from "app/components/designSystem/Typography";
import { Props as AppIconProps }  from "./designSystem/Icon";
import { Icon } from "./designSystem/Icon";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import type { Optional } from "evt/tools/typeSafety";
import Box from "@material-ui/core/Box";
import { noUndefined } from "app/utils/noUndefined";

export type Props = {
    icon: AppIconProps["type"];
    text1: NonNullable<React.ReactNode>;
    text2: NonNullable<React.ReactNode>;
    text3: NonNullable<React.ReactNode>;
};

export const defaultProps: Optional<Props> = {
    "className": null,
    "variant": "body1",
    "color": "primary",
    "style": null
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
        },
        "icon": {
            "marginRight": theme.spacing(2),
            "position": "relative",
            "top": "5px",
        },
        "text2": {
            "marginBottom": theme.spacing(1)
        }
    })
);

export function PageHeader(props: Props) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { icon, text1, text2, text3  } = completedProps;

    const classes = useStyles(completedProps);

    return (
        <Box className={classes.root}>
            <Typography variant="h2" className={classes.text1}>
                <Icon type={icon} fontSize="large" className={classes.icon} />
                {text1}
            </Typography>
            <Typography variant="h5" className={classes.text2}>{text2}</Typography>
            <Typography variant="body1">{text3}</Typography>
        </Box>
    );

}

