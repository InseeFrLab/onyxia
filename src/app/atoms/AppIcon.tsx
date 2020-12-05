

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
import type { Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type Props = {
    /** Design which icon should be displayed */
    type: "tour" | "services" | "secrets" | "profile" |
    "lab" | "info" | "home" | "trainings" | "files" |
    "collaborationTools" | "bash";
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

export function AppIcon(props: Props) {

    const { type, color, fontSize } = {
        ...defaultProps,
        ...noUndefined(props)
    };

    // https://github.com/mui-org/material-ui/blob/4c5fffc342c46466fb5c68759e5ecfbfe3e4a3db/packages/material-ui/src/SvgIcon/SvgIcon.js
    return <SvgIcon
        component={(() => {
            switch (type) {
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
            }
        })()}
        color={color}
        fontSize={fontSize}
    />;
}