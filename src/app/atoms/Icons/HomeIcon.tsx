
import React from "react";
import SvgIcon from "@material-ui/core/SvgIcon";
import type { SvgIconProps } from "@material-ui/core/SvgIcon";
import { ReactComponent as HomeIconSvg } from "./svg/HomeIconStock.svg";

export function HomeIcon(props: SvgIconProps) {
    return <SvgIcon  {...props} component={HomeIconSvg}/>;
}