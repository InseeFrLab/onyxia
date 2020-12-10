
import React from "react";
import Typography from "@material-ui/core/Typography";
import { Props as AppIconProps }  from "../atoms/AppIcon";
import { AppIcon } from "../atoms/AppIcon";

export type Props = {
    icon: AppIconProps["type"] | undefined;
    text1: React.ReactNode;
    text2: React.ReactNode;
    text3: React.ReactNode;
};

export function PageHeader(props: Props) {

    const { icon, text1, text2, text3 } = props;

    return (
        <>
            <Typography variant="h3">{icon === undefined ? null : <AppIcon type={icon} />}{text1}</Typography>
            <Typography variant="h6">{text2}</Typography>
            <Typography variant="subtitle1">{text3}</Typography>
        </>
    );

}

