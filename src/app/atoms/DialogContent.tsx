

import React from "react";
import MuiDialogContent from "@material-ui/core/DialogContent";
import type { DialogContentClassKey } from "@material-ui/core/DialogContent";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import type { Id } from "evt/tools/typeSafety";

// https://material-ui.com/components/dialogs/#form-dialogs

export type Props = {
  children: React.ReactNode;
};

const useStyles = makeStyles(
  () => createStyles<Id<DialogContentClassKey, "dividers">, {}>({
    "dividers": {
      "borderBottom": "unset"
    }
  })
);

export function DialogContent(props: Props) {

  const { children } = props;

  const classes = useStyles();

  return (
    <MuiDialogContent classes={classes} dividers={true}>
      {children}
    </MuiDialogContent>
  );

}
