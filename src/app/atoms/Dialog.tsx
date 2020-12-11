
import React from "react";
import type { Optional } from "evt/tools/typeSafety";
import MuiDialog from "@material-ui/core/Dialog";
import type { DialogClassKey, DialogProps } from "@material-ui/core/Dialog";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import { noUndefined } from "app/utils/noUndefined";
import type { Id } from "evt/tools/typeSafety";

// https://material-ui.com/components/dialogs/#form-dialogs



export type Props = {
    open: DialogProps["open"];
    onClose: NonNullable<DialogProps["onClose"]>;
    'aria-labelledby': string;
    children: React.ReactNode;
};

export const defaultProps: Optional<Props> = {
};

const useStyles = makeStyles(
    () => createStyles<Id<DialogClassKey, "root">, Required<Props>>({
        "root": {
        }
    })
);

export function Dialog(props: Props) {

    const completedProps= {
        ...defaultProps,
        ...noUndefined(props)
    };

    const { open, onClose, children } = completedProps

    const classes = useStyles(completedProps);

    return (
        <MuiDialog
            classes={classes}
            open={open}
            onClose={onClose}
            aria-labelledby={completedProps["aria-labelledby"]}
        >
            {children}
        </MuiDialog>
    );

}






