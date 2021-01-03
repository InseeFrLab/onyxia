import React from "react";
import MuiDialogAction from "@material-ui/core/DialogActions";
import type { DialogActionsClassKey } from "@material-ui/core/DialogActions";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import type { Id } from "evt/tools/typeSafety";

export type DialogActionsProps = {
    children: NonNullable<React.ReactNode>;
};

const useStyles = makeStyles(
    () => createStyles<Id<DialogActionsClassKey, "root">, {}>({
        "root": {
        }
    })
);

export function DialogActions(props: DialogActionsProps) {

    const { children } = props;

    const classes = useStyles();

    return <MuiDialogAction classes={classes}>{children}</MuiDialogAction>;

}
