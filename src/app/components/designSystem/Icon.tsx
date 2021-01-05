
import React from "react";
import SvgIcon from "@material-ui/core/SvgIcon";
import { ReactComponent as TourSvg } from "app/assets/svg/AssistedTour.svg";
import { ReactComponent as ServicesSvg } from "app/assets/svg/Services.svg";
import { ReactComponent as SecretsSvg } from "app/assets/svg/Secrets.svg";
import { ReactComponent as ProfileSvg } from "app/assets/svg/Profile.svg";
import { ReactComponent as LabSvg } from "app/assets/svg/Lab.svg";
import { ReactComponent as InfoSvg } from "app/assets/svg/Info.svg";
import { ReactComponent as HomeSvg } from "app/assets/svg/Home.svg";
import { ReactComponent as TrainingsSvg } from "app/assets/svg/Trainings.svg";
import { ReactComponent as FilesSvg } from "app/assets/svg/Files.svg";
import { ReactComponent as CollaborationToolsSvg } from "app/assets/svg/CollaborationTools.svg";
import { ReactComponent as BashSvg } from "app/assets/svg/Bash.svg";
import { ReactComponent as LockSvg } from "app/assets/svg/Lock.svg";
import type { Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

import DeleteIcon from "@material-ui/icons/Delete";

export type SvgTypes =
    "tour" | "services" | "secrets" | "profile" |
    "lab" | "info" | "home" | "trainings" | "files" |
    "collaborationTools" | "bash" | "lock";

export type MaterialType = "delete";

export type Props = {
    /** Design which icon should be displayed */
    type: SvgTypes | MaterialType;
    /** Color of the icon based on the theme */
    color?: "inherit" | "disabled" | "primary" |
    "secondary" | "action" | "error";
    /** Enable to make the icon larger or smaller */
    fontSize?: "default" | "inherit" | "small" | "large"
};

export const defaultProps: Optional<Props> = {
    "color": "inherit",
    "fontSize": "default"
};

export function Icon(props: Props) {

    const { type, color, fontSize } = {
        ...defaultProps,
        ...noUndefined(props)
    };

    const svgTypeOrMuiIcon = (()=>{
        switch(type){
            case "delete": return DeleteIcon;
            default: return type;
        }
    })();
    
    if (typeof svgTypeOrMuiIcon !== "string") {

        const MuiIcon = svgTypeOrMuiIcon;

        return <MuiIcon {...{ color, fontSize }}/>;
    }

    const svgType = svgTypeOrMuiIcon;

    return <SvgIcon
        component={(() => {
            switch (svgType) {
                case "tour": return TourSvg;
                case "services": return ServicesSvg;
                case "secrets": return SecretsSvg;
                case "profile": return ProfileSvg;
                case "lab": return LabSvg;
                case "info": return InfoSvg;
                case "home": return HomeSvg;
                case "trainings": return TrainingsSvg;
                case "files": return FilesSvg;
                case "collaborationTools": return CollaborationToolsSvg;
                case "bash": return BashSvg;
                case "lock": return LockSvg;
            }
        })()}
        {...{ color, fontSize }}
    />;
}