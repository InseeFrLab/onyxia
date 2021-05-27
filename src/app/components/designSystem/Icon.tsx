
import { createUseClassNames } from "app/theme/useClassNames";
import { cx } from "tss-react";
import { forwardRef, memo } from "react";
import type { MouseEventHandler } from "react";
import SvgIcon from "@material-ui/core/SvgIcon";
import { ReactComponent as TourSvg } from "app/assets/svg/Tour.svg";
import { ReactComponent as ServicesSvg } from "app/assets/svg/Services.svg";
import { ReactComponent as SecretsSvg } from "app/assets/svg/Secrets.svg";
import { ReactComponent as AccountSvg } from "app/assets/svg/Account2.svg";
import { ReactComponent as HomeSvg } from "app/assets/svg/Home2.svg";
import { ReactComponent as TrainingsSvg } from "app/assets/svg/Trainings2.svg";
import { ReactComponent as FilesSvg } from "app/assets/svg/Files.svg";
import { ReactComponent as CollaborationToolsSvg } from "app/assets/svg/CollaborationTools.svg";
import { ReactComponent as BashSvg } from "app/assets/svg/Bash.svg";
import { ReactComponent as CommunitySvg } from "app/assets/svg/Community.svg";
import { ReactComponent as CatalogSvg } from "app/assets/svg/Catalog.svg";
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
import { doExtends } from "tsafe/doExtends";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import GetApp from "@material-ui/icons/GetApp";
import Replay from "@material-ui/icons/Replay";
import Help from "@material-ui/icons/Help";
import Search from "@material-ui/icons/Search";
import Cancel from "@material-ui/icons/Cancel";
import Bookmark from "@material-ui/icons/Bookmark";
import BookmarkBorder from "@material-ui/icons/BookmarkBorder";
import Code from "@material-ui/icons/Code";
import Link from "@material-ui/icons/Link";
import SubdirectoryArrowRight from "@material-ui/icons/SubdirectoryArrowRight";

import { noUndefined } from "app/tools/noUndefined";
import type { PickOptionals } from "tsafe";
import { typeGuard } from "tsafe/typeGuard";


const svgTypes = [
    "tour", "services", "secrets", "account", "home", "trainings", "files",
    "collaborationTools", "bash", "community", "catalog"
] as const;

export type SvgTypes = typeof svgTypes[number];

const materialType = [
    "delete", "edit", "add", "filterNone",
    "check", "expandMore", "attachMoney", "chevronLeft",
    "cached", "closeSharp", "infoOutlined", "brightness7", "brightness4",
    "translate", "visibility", "visibilityOff", "getApp", "replay",
    "help", "search", "cancel", "bookmark", "bookmarkBorder", "code",
    "link", "subdirectoryArrowRight"
] as const;

export type MaterialType = typeof materialType[number];

//NOTE: Ensure there is not overlap between the types
doExtends<SvgTypes & MaterialType, never>();

export type Props = {

    className?: string | null;

    /** Design which icon should be displayed */
    type: SvgTypes | MaterialType;
    /** Color of the icon based on the theme */
    color?: "textPrimary" | "textSecondary" | "textDisabled" | "textFocus" | "limeGreen";
    /** TODO: Only works for mui icons!!! Enable to make the icon larger or smaller */
    fontSize?: "default" | "inherit" | "small" | "large";

    onClick?: MouseEventHandler<SVGSVGElement> | null;

};

export const defaultProps: PickOptionals<Props> = {
    "className": null,
    "color": "textPrimary",
    "fontSize": "default",
    "onClick": null

};

const { useClassNames } = createUseClassNames<Required<Props>>()(
    (theme, { color }) => ({
        "root": {
            "color": color === "limeGreen" ?
                theme.custom.colors.palette.limeGreen.main :
                theme.custom.colors.useCases.typography[color],
            // https://stackoverflow.com/a/24626986/3731798
            //"verticalAlign": "top",
            //"display": "inline-block"
            "verticalAlign": "top"
        }
    })
);


export const Icon = memo(forwardRef<SVGSVGElement, Props>((props, ref) => {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const {
        type,
        fontSize,
        className,
        onClick,
        //For the forwarding, rest should be empty (typewise),
        color,
        children,
        ...rest
    } = completedProps;

    const { classNames } = useClassNames(completedProps);

    const svgTypeOrMuiIcon = (() => {

        if (!typeGuard<MaterialType>(type, !!materialType.find(t => t === type))) {
            return type;
        }

        switch (type) {
            case "delete": return DeleteIcon;
            case "edit": return EditIcon;
            case "add": return AddIcon;
            case "filterNone": return FilterNoneIcon;
            case "check": return CheckIcon;
            case "closeSharp": return CloseSharp;
            case "infoOutlined": return InfoOutlined;
            case "expandMore": return ExpandMore;
            case "attachMoney": return AttachMoney;
            case "chevronLeft": return ChevronLeft;
            case "cached": return Cached;
            case "visibility": return Visibility;
            case "visibilityOff": return VisibilityOff;
            case "getApp": return GetApp;
            case "replay": return Replay;
            case "help": return Help;
            case "search": return Search;
            case "cancel": return Cancel;
            case "brightness7": return Brightness7;
            case "brightness4": return Brightness4;
            case "translate": return Translate;
            case "bookmark": return Bookmark;
            case "bookmarkBorder": return BookmarkBorder;
            case "code": return Code;
            case "link": return Link;
            case "subdirectoryArrowRight": return SubdirectoryArrowRight;
        }

    })();

    if (typeof svgTypeOrMuiIcon !== "string") {

        const MuiIcon = svgTypeOrMuiIcon;

        return <MuiIcon
            ref={ref}
            className={cx(classNames.root, className)}
            fontSize={fontSize}
            children={children}
            onClick={onClick ?? undefined}
            {...rest}
        />;
    }

    const svgType = svgTypeOrMuiIcon;

    return <SvgIcon
        ref={ref}
        onClick={onClick ?? undefined}
        className={cx(classNames.root, className)}
        component={(() => {
            switch (svgType) {
                case "tour": return TourSvg;
                case "services": return ServicesSvg;
                case "secrets": return SecretsSvg;
                case "files": return FilesSvg;
                case "collaborationTools": return CollaborationToolsSvg;
                case "bash": return BashSvg;
                case "community": return CommunitySvg;
                case "catalog": return CatalogSvg;
                case "account": return AccountSvg;
                case "home": return HomeSvg;
                case "trainings": return TrainingsSvg;
            }
        })()}
        fontSize={fontSize}
        {...rest}
    />;
}));