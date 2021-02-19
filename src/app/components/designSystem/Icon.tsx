
import { createUseClassNames, cx } from "app/theme/useClassNames";
import { memo } from "react";
import SvgIcon from "@material-ui/core/SvgIcon";
import { ReactComponent as TourSvg } from "app/assets/svg/Tour.svg";
import { ReactComponent as ServicesSvg } from "app/assets/svg/Services.svg";
import { ReactComponent as SecretsSvg } from "app/assets/svg/Secrets.svg";
import { ReactComponent as AccountSvg } from "app/assets/svg/Account.svg";
import { ReactComponent as HomeSvg } from "app/assets/svg/Home.svg";
import { ReactComponent as TrainingsSvg } from "app/assets/svg/Trainings.svg";
import { ReactComponent as FilesSvg } from "app/assets/svg/Files.svg";
import { ReactComponent as CollaborationToolsSvg } from "app/assets/svg/CollaborationTools.svg";
import { ReactComponent as BashSvg } from "app/assets/svg/Bash.svg";
import { ReactComponent as CommunitySvg } from "app/assets/svg/Community.svg";
import { ReactComponent as CatalogSvg } from "app/assets/svg/Catalog.svg";
import type { Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/tools/noUndefined";
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
import InfoOutlined from "@material-ui/icons/InfoOutlined";
import Brightness7 from "@material-ui/icons/Brightness7";
import Brightness4 from "@material-ui/icons/Brightness4";
import Translate from "@material-ui/icons/Translate";
import { doExtends } from "app/tools/doExtends";


export type SvgTypes =
    "tour" | "services" | "secrets" | "account" | "home" | "trainings" | "files" |
    "collaborationTools" | "bash" | "community"| "catalog";

export type MaterialType = 
    "delete" | "edit" | "add" | "filterNone" |
    "check" | "expandMore" | "attachMoney" | "chevronLeft" |
    "cached" | "closeSharp" | "infoOutlined" | "brightness7"  | "brightness4" |
    "translate";

//NOTE: Ensure there is not overlap between the types
doExtends<SvgTypes & MaterialType, never>();

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
            case "infoOutlined": return InfoOutlined;
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
                case "account": return AccountSvg;
                case "home": return HomeSvg;
                case "trainings": return TrainingsSvg;
                case "files": return FilesSvg;
                case "collaborationTools": return CollaborationToolsSvg;
                case "bash": return BashSvg;
                case "expandMore": return ExpandMore;
                case "attachMoney": return AttachMoney;
                case "chevronLeft": return ChevronLeft;
                case "cached": return Cached;
                case "community": return CommunitySvg;
                case "brightness7": return Brightness7;
                case "brightness4": return Brightness4;
                case "translate": return Translate;
                case "catalog": return CatalogSvg;
            }
        })()}
        fontSize={fontSize}
    />;
});