import React from "react";
import MuiDialogAction from "@material-ui/core/DialogActions";
import type { DialogActionsClassKey } from "@material-ui/core/DialogActions";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import type { Id } from "evt/tools/typeSafety";

export type Props = {
    children: React.ReactNode;
};

const useStyles = makeStyles(
    () => createStyles<Id<DialogActionsClassKey, "root">, {}>({
        "root": {
        }
    })
);

export function DialogActions(props: Props) {

    const { children } = props;

    const classes = useStyles();

    return <MuiDialogAction classes={classes}>{children}</MuiDialogAction>;

}
