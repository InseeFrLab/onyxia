

import React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiCircularProgress from "@material-ui/core/CircularProgress";
import type { CircularProgressClassKey } from "@material-ui/core/CircularProgress";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type Props = {
    className?: string | null;
    size?: number;
    color?: "primary" | "textPrimary"
};

export const defaultProps: Optional<Props> = {
    "className": null,
    "size": 40,
    "color": "primary"
};


const useStyles = makeStyles(
    theme => createStyles<Id<CircularProgressClassKey, "root">, Required<Props>>({
        "root": ({ color }) => ({
            "color": color !== "textPrimary" ? undefined : theme.palette.text.primary
        })
    })
);


export function CircularProgress(props: Props) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { color, size } = completedProps;

    const classes = useStyles(completedProps);

    return (
        <MuiCircularProgress
            color={color === "textPrimary" ? undefined : color}
            classes={classes}
            size={size}
        />
    );

}






