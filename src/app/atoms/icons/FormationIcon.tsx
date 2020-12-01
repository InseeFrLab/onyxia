
import React from "react";
import SvgIcon from "@material-ui/core/SvgIcon";
import type { SvgIconProps } from "@material-ui/core/SvgIcon";
import { ReactComponent as IconSvg } from "./svg/Formation.svg";

export function FormationIcon(props: SvgIconProps) {
    return <SvgIcon  {...props} component={IconSvg}/>;
}