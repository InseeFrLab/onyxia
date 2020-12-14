

import React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiContainer from "@material-ui/core/Container";
import type { ContainerClassKey } from "@material-ui/core/Container";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type Props = {
    children: NonNullable<React.ReactNode>;
    maxWidth?: "sm" | "lg";
};

export const defaultProps: Optional<Props> = {
    "maxWidth": "lg"
};

const useStyles = makeStyles(
    () => createStyles<Id<ContainerClassKey, "root">, Required<Props>>({
        "root": {
        }
    })
);

export function Container(props: Props) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { children, maxWidth } = completedProps;

    const classes = useStyles(completedProps);

    return <MuiContainer classes={classes} maxWidth={maxWidth}>{children}</MuiContainer>;

}






