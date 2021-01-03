
import React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiButton from "@material-ui/core/Button";
import type { ButtonClassKey } from "@material-ui/core/Button";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";
import type { Props as IconProps } from "./Icon";
import { Icon } from "./Icon";

export type Props = {
  /** Correspond to the app theme' color palette */
  color?: "primary" | "secondary";
  /** Usually a plain text that labels the button */
  children?: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  icon?: IconProps["type"] | null;
};

export const defaultProps: Optional<Props> = {
  "color": "primary",
  "disabled": false,
  "icon": null,
  "children": null
};


const useStyles = makeStyles(
  () => createStyles<Id<ButtonClassKey, "root" | "label">, Required<Props>>({
    "root": {
      "&.Mui-disabled > .MuiButton-label": {
      }
    },
    "label": {
    }
  })
);


export function Button(props: Props) {

  const completedProps = { ...defaultProps, ...noUndefined(props) };

  const { color, disabled, children, icon, onClick } = { ...defaultProps, ...noUndefined(props) };

  const classes = useStyles(completedProps);

  return (
    <MuiButton 
      classes={classes} 
      color={color} 
      disabled={disabled}
      onClick={onClick}
    >
      {icon !== null && <Icon type={icon} />}
      {children}
    </MuiButton>
  );

}






