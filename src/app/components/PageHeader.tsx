
import React from "react";
import { Typography } from "app/components/designSystem/Typography";
import { Props as AppIconProps }  from "./designSystem/Icon";
import { Icon } from "./designSystem/Icon";

export type Props = {
    icon: AppIconProps["type"] | undefined;
    text1: NonNullable<React.ReactNode>;
    text2: NonNullable<React.ReactNode>;
    text3: NonNullable<React.ReactNode>;
};

export function PageHeader(props: Props) {

    const { icon, text1, text2, text3 } = props;

    return (
        <>
            <Typography variant="h3">{icon === undefined ? null : <Icon type={icon} />}{text1}</Typography>
            <Typography variant="h6">{text2}</Typography>
            <Typography variant="subtitle1">{text3}</Typography>
        </>
    );

}

