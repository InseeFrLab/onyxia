
import { createUseClassNames, cx } from "app/theme/useClassNames";
import { memo } from "react";
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
import EditIcon from "@material-ui/icons/Edit";
import AddIcon from "@material-ui/icons/Add";
import FilterNoneIcon from "@material-ui/icons/FilterNone";
import CheckIcon from "@material-ui/icons/Check";
import ExpandMore from "@material-ui/icons/ExpandMore";
import AttachMoney from "@material-ui/icons/AttachMoney";
import ChevronLeft from "@material-ui/icons/ChevronLeft";
import Cached from "@material-ui/icons/Cached";
import CloseSharp from "@material-ui/icons/CloseSharp";

export type SvgTypes =
    "tour" | "services" | "secrets" | "profile" |
    "lab" | "info" | "home" | "trainings" | "files" |
    "collaborationTools" | "bash";

export type MaterialType = 
    "delete" | "edit" | "add" | "filterNone" |
    "check" | "expandMore" | "attachMoney" | "chevronLeft" |
    "cached" | "closeSharp";

//NOTE: Ensure there is not overlap between the types
(function f<T extends never>(): T | void { })<SvgTypes & MaterialType>();


export type Props = {

    className?: string | null;

    /** Design which icon should be displayed */
    type: SvgTypes | MaterialType;
    /** Color of the icon based on the theme */
    color?: "textPrimary" | "textSecondary" | "textDisabled" | "textFocus" | "limeGreen";
    /** Enable to make the icon larger or smaller */
    fontSize?: "default" | "inherit" | "small" | "large";


};

export const defaultProps: Optional<Props> = {
    "className": null,
    "color": "textPrimary",
    "fontSize": "default"
};

const { useClassNames } = createUseClassNames<Required<Props>>()(
    ({ theme: { custom: { colors }} }, { color }) => ({
        "root": {
            "color": color === "limeGreen" ?
                colors.palette.limeGreen.main :
                colors.useCases.typography[color],
            // https://stackoverflow.com/a/24626986/3731798
            //"verticalAlign": "top",
            //"display": "inline-block"
            "verticalAlign": "top"
        }
    })
);


export const Icon = memo((props: Props) => {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { type, fontSize, className } = completedProps;

    const { classNames } = useClassNames(completedProps);

    const svgTypeOrMuiIcon = (() => {
        switch (type) {
            case "delete": return DeleteIcon;
            case "edit": return EditIcon;
            case "add": return AddIcon;
            case "filterNone": return FilterNoneIcon;
            case "check": return CheckIcon;
            case "closeSharp": return CloseSharp;
            default: return type;
        }
    })();

    if (typeof svgTypeOrMuiIcon !== "string") {

        const MuiIcon = svgTypeOrMuiIcon;

        return <MuiIcon
            className={cx(classNames.root, className)}
            fontSize={fontSize}
        />;
    }

    const svgType = svgTypeOrMuiIcon;

    return <SvgIcon
        className={cx(classNames.root, className)}
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
                case "expandMore": return ExpandMore;
                case "attachMoney": return AttachMoney;
                case "chevronLeft": return ChevronLeft;
                case "cached": return Cached;
            }
        })()}
        fontSize={fontSize}
    />;
});