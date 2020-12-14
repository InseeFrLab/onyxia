
import React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiButton from "@material-ui/core/Button";
import type { ButtonClassKey } from "@material-ui/core/Button";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type Props = {
  /** Correspond to the app theme' color palette */
  color?: "primary" | "secondary";
  /** Usually a plain text that labels the button */
  children: NonNullable<React.ReactNode>;
  disabled?: boolean;
  onClick: () => void;
};

export const defaultProps: Optional<Props> = {
  "color": "primary",
  "disabled": false
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


export function Button(props: Props) {

  const { color, disabled, children } = { ...defaultProps, ...noUndefined(props) };

  const classes = useStyles();

  return <MuiButton classes={classes} color={color} disabled={disabled}>{children}</MuiButton>;

}






