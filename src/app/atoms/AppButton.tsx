
import React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import type { ButtonProps, ButtonClassKey } from "@material-ui/core/Button";
import type { Id } from "evt/tools/typeSafety";

export type Props = {
  color?: "primary" | "secondary";
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


/**
 * 
 * https://user-images.githubusercontent.com/6702424/100876410-a5285a00-34a7-11eb-8bdd-b54592d34697.png
 * 
 * Apps button
 * @param props 
 * @returns  
 */
export function AppButton(props: Props & Omit<ButtonProps, keyof Props>) {

  const { color, ...other } = props;

  const classes = useStyles();

  return <Button classes={classes} color={color} {...other} />;

}






