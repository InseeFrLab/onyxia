
import React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import type { ButtonClassKey } from "@material-ui/core/Button";
import type { Id } from "evt/tools/typeSafety";

export type Props = {
  /** Correspond to the app theme' color palette */
  color?: "primary" | "secondary";
  /** Usually a plain text that labels the button */
  children: React.ReactNode;
  disabled?: boolean;
};

const useStyles = makeStyles(
  () => createStyles<Id<ButtonClassKey, "root" | "label">, {}>({
    "root": {
      "&.Mui-disabled > .MuiButton-label": {
      }
    },
    "label": {
    }
  })
);


export function AppButton(props: Props) {

  const { color = "primary", disabled = false, children } = props;

  const classes = useStyles();

  return <Button classes={classes} color={color} disabled={disabled}>{children}</Button>;

}






