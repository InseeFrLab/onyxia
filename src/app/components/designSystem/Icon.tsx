
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

import DeleteIcon from "@material-ui/icons/Delete";
import LockIcon from "@material-ui/icons/Lock";
import EditIcon from "@material-ui/icons/Edit";
import AddIcon from "@material-ui/icons/Add";
import FilterNoneIcon from "@material-ui/icons/FilterNone";
import CheckIcon from "@material-ui/icons/Check";

export type SvgTypes =
    "tour" | "services" | "secrets" | "profile" |
    "lab" | "info" | "home" | "trainings" | "files" |
    "collaborationTools" | "bash";

export type MaterialType = 
    "delete" | "lock" | "edit" | "add" | "filterNone" |
    "check";

//NOTE: Ensure there is not overlap between the types
(function f<T extends never>(): T | void { })<SvgTypes & MaterialType>();


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

    const svgTypeOrMuiIcon = (() => {
        switch (type) {
            case "delete": return DeleteIcon;
            case "lock": return LockIcon;
            case "edit": return EditIcon;
            case "add": return AddIcon;
            case "filterNone": return FilterNoneIcon;
            case "check": return CheckIcon;
            default: return type;
        }
    })();

    if (typeof svgTypeOrMuiIcon !== "string") {

        const MuiIcon = svgTypeOrMuiIcon;

        return <MuiIcon {...{ color, fontSize }} />;
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
            }
        })()}
        {...{ color, fontSize }}
    />;
}