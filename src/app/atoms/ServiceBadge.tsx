

import React from "react";
import Avatar from "@material-ui/core/Avatar";
import type { AvatarProps } from "@material-ui/core/Avatar";
import vsCodeImg from "app/res/img/vscode.png";
import rStudioImg from "app/res/img/rstudio.png";

export type Props = AvatarProps & {
    type: "vscode" | "rStudio" ;
};

export function ServiceBadge(props: Props) {

    const { type, ...avatarProps } = props;

    return <Avatar  {...avatarProps} alt={type} src={(()=>{
        switch(type){
            case "vscode": return vsCodeImg;
            case "rStudio": return rStudioImg;
        }
    })()}/>;

}