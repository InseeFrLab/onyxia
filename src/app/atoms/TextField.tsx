
import React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiTextField from "@material-ui/core/TextField";
import type { TextFieldClassKey } from "@material-ui/core/TextField";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type Props = {
  children: React.ReactNode;
};

export const defaultProps: Optional<Props> = {
};


const useStyles = makeStyles(
  () => createStyles<Id<TextFieldClassKey, "root">, Required<Props>>({
    "root": {
    }
  })
);


export function TextField(props: Props) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

  const { children } = completedProps;

  const classes = useStyles(completedProps);

    return <MuiTextField classes={classes} >{children}</MuiTextField>;

}






