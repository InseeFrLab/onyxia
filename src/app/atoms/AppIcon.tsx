

import React from "react";
import SvgIcon from "@material-ui/core/SvgIcon";
import { ReactComponent as tourSvg } from "app/assets/svg/AssistedTour.svg";
import { ReactComponent as servicesSvg } from "app/assets/svg/Services.svg";
import { ReactComponent as secretsSvg } from "app/assets/svg/Secrets.svg";
import { ReactComponent as profileSvg } from "app/assets/svg/Profile.svg";
import { ReactComponent as labSvg } from "app/assets/svg/Lab.svg";
import { ReactComponent as infoSvg } from "app/assets/svg/Info.svg";
import { ReactComponent as homeSvg } from "app/assets/svg/Home.svg";
import { ReactComponent as trainingsSvg } from "app/assets/svg/Trainings.svg";
import { ReactComponent as filesSvg } from "app/assets/svg/Files.svg";
import { ReactComponent as collaborationToolsSvg } from "app/assets/svg/CollaborationTools.svg";
import { ReactComponent as bashSvg } from "app/assets/svg/Bash.svg";

export type Props = {
    /** Design which icon should be displayed */
    type: "tour" | "services" | "secrets" | "profile" |
    "lab" | "info" | "home" | "trainings" | "files" |
    "collaborationTools" | "bash";
    /** Color of the icon based on the theme */
    color?: "inherit" | "disabled" | "primary" |
    "secondary" | "action" | "error";
};

export function AppIcon(props: Props) {

    const { type, color = "inherit" } = props;

    return <SvgIcon
        component={(() => {
            switch (type) {
                case "tour": return tourSvg;
                case "services": return servicesSvg;
                case "secrets": return secretsSvg;
                case "profile": return profileSvg;
                case "lab": return labSvg;
                case "info": return infoSvg;
                case "home": return homeSvg;
                case "trainings": return trainingsSvg;
                case "files": return filesSvg;
                case "collaborationTools": return collaborationToolsSvg;
                case "bash": return bashSvg;
            }
        })()}
        color={color}
    />;
}