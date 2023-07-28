import {
    createThemeProvider,
    defaultPalette,
    francePalette,
    ultravioletPalette,
    verdantPalette,
    defaultGetTypographyDesc,
    getIsPortraitOrientation,
    ViewPortOutOfRangeError
} from "onyxia-ui";
import type { ThemeProviderProps } from "onyxia-ui";
import { createIcon } from "onyxia-ui/Icon";
import { createIconButton } from "onyxia-ui/IconButton";
import { createButton } from "onyxia-ui/Button";
import { createButtonBarButton } from "onyxia-ui/ButtonBarButton";
import { createButtonBar } from "onyxia-ui/ButtonBar";
import { createText } from "onyxia-ui/Text";
import { createPageHeader } from "onyxia-ui/PageHeader_legacy";
import { createMakeAndWithStyles } from "tss-react";
import { createLanguageSelect } from "onyxia-ui/LanguageSelect";
import { createLeftBar } from "onyxia-ui/LeftBar";
import { ReactComponent as TourSvg } from "./assets/svg/Tour.svg";
import { ReactComponent as ServicesSvg } from "./assets/svg/Services.svg";
import { ReactComponent as SecretsSvg } from "./assets/svg/Secrets.svg";
import { ReactComponent as AccountSvg } from "./assets/svg/Account2.svg";
import { ReactComponent as HomeSvg } from "./assets/svg/Home2.svg";
import { ReactComponent as FilesSvg } from "./assets/svg/Files.svg";
import { ReactComponent as CollaborationToolsSvg } from "./assets/svg/CollaborationTools.svg";
import { ReactComponent as BashSvg } from "./assets/svg/Bash.svg";
import { ReactComponent as CatalogSvg } from "./assets/svg/Catalog.svg";
import { ReactComponent as KeySvg } from "./assets/svg/Key.svg";
import { ReactComponent as TrainingsLogoSvg } from "ui/assets/svg/Trainings2.svg";
import { ReactComponent as RefreshLogoSvg } from "ui/assets/svg/Refresh.svg";
import AssuredWorkloadIcon from "@mui/icons-material/AssuredWorkload";
import GradingIcon from "@mui/icons-material/Grading";
import SentimentSatisfiedIcon from "@mui/icons-material/SentimentSatisfied";
import DeleteIcon from "@mui/icons-material/Delete";
import PublicIcon from "@mui/icons-material/Public";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import FilterNoneIcon from "@mui/icons-material/FilterNone";
import CheckIcon from "@mui/icons-material/Check";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import CachedIcon from "@mui/icons-material/Cached";
import CloseSharp from "@mui/icons-material/CloseSharp";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import TranslateIcon from "@mui/icons-material/Translate";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LanguageIcon from "@mui/icons-material/Language";
import GetAppIcon from "@mui/icons-material/GetApp";
import ReplayIcon from "@mui/icons-material/Replay";
import HelpIcon from "@mui/icons-material/Help";
import SearchIcon from "@mui/icons-material/Search";
import CancelIcon from "@mui/icons-material/Cancel";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import CodeIcon from "@mui/icons-material/Code";
import LinkIcon from "@mui/icons-material/Link";
import EqualizerIcon from "@mui/icons-material/Equalizer";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SubdirectoryArrowRightIcon from "@mui/icons-material/SubdirectoryArrowRight";
import PeopleIcon from "@mui/icons-material/People";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import type { Param0 } from "tsafe/Param0";
import { ComponentType } from "ui/tools/types/ComponentType";
import type { Language } from "ui/i18n";
import { createOnyxiaSplashScreenLogo } from "onyxia-ui/lib/SplashScreen";
import { THEME_ID } from "keycloak-theme/login/envCarriedOverToKc";
import { getOverridePalette } from "./env";

const { ThemeProvider, useTheme } = createThemeProvider({
    "getTypographyDesc": params => ({
        ...defaultGetTypographyDesc(params),
        "fontFamily": `${(() => {
            switch (THEME_ID) {
                case "france":
                    return "Marianne";
                case "onyxia":
                case "ultraviolet":
                case "verdant":
                    return '"Work Sans"';
            }
        })()}, sans-serif`
    }),
    "palette": {
        ...(() => {
            const palette_override = getOverridePalette();
            if (palette_override) {
                const ssbPalette: typeof defaultPalette = {
                    ...defaultPalette,
                    ...palette_override
                };
                return ssbPalette;
            } else {
                switch (THEME_ID) {
                    case "onyxia":
                        return defaultPalette;
                    case "france":
                        return francePalette;
                    case "ultraviolet":
                        return ultravioletPalette;
                    case "verdant":
                        return verdantPalette;
                }
            }
        })(),
        "limeGreen": {
            "main": "#BAFF29",
            "light": "#E2FFA6"
        },
        "agentConnectBlue": {
            "main": "#0579EE",
            "light": "#2E94FA",
            "lighter": "#E5EDF5"
        }
    }
});

export { ThemeProvider };

export const { makeStyles, useStyles } = createMakeAndWithStyles({ useTheme });

/** @see: <https://next.material-ui.com/components/material-icons/> */
export const { Icon } = createIcon({
    "delete": DeleteIcon,
    "edit": EditIcon,
    "add": AddIcon,
    "filterNone": FilterNoneIcon,
    "check": CheckIcon,
    "expandMore": ExpandMoreIcon,
    "attachMoney": AttachMoneyIcon,
    "chevronLeft": ChevronLeftIcon,
    "cached": CachedIcon,
    "close": CloseSharp,
    "infoOutlined": InfoOutlinedIcon,
    "brightness7": Brightness7Icon,
    "brightness4": Brightness4Icon,
    "translate": TranslateIcon,
    "visibility": VisibilityIcon,
    "visibilityOff": VisibilityOffIcon,
    "getApp": GetAppIcon,
    "replay": ReplayIcon,
    "help": HelpIcon,
    "search": SearchIcon,
    "cancel": CancelIcon,
    "bookmark": BookmarkIcon,
    "bookmarkBorder": BookmarkBorderIcon,
    "code": CodeIcon,
    "link": LinkIcon,
    "subdirectoryArrowRight": SubdirectoryArrowRightIcon,
    "accessTime": AccessTimeIcon,
    "equalizer": EqualizerIcon,
    "moreVert": MoreVertIcon,
    "public": PublicIcon,
    "sentimentSatisfied": SentimentSatisfiedIcon,
    "tour": TourSvg,
    "services": ServicesSvg,
    "secrets": SecretsSvg,
    "account": AccountSvg,
    "home": HomeSvg,
    "files": FilesSvg,
    "collaborationTools": CollaborationToolsSvg,
    "bash": BashSvg,
    "catalog": CatalogSvg,
    "key": KeySvg,
    "language": LanguageIcon,
    "training": TrainingsLogoSvg,
    "people": PeopleIcon,
    "errorOutline": ErrorOutlineIcon,
    "assuredWorkload": AssuredWorkloadIcon,
    "grading": GradingIcon,
    "refresh": RefreshLogoSvg
});

export type IconId = Param0<typeof Icon>["iconId"];

export const { IconButton } = createIconButton({ Icon });
export const { Button } = createButton({ Icon });
export const { Text } = createText({ useTheme });

export function createGetViewPortConfig(params: {
    PortraitModeUnsupported: ComponentType;
}) {
    const { PortraitModeUnsupported } = params;

    const getViewPortConfig: ThemeProviderProps["getViewPortConfig"] = ({
        windowInnerWidth,
        windowInnerHeight
    }) => {
        if (
            getIsPortraitOrientation({
                windowInnerWidth,
                windowInnerHeight
            })
        ) {
            throw new ViewPortOutOfRangeError(<PortraitModeUnsupported />);
        }

        return {
            "targetWindowInnerWidth": 1920,
            "targetBrowserFontSizeFactor": 1
        };
    };

    return { getViewPortConfig };
}

const { OnyxiaSplashScreenLogo } = createOnyxiaSplashScreenLogo({ useTheme });

export const splashScreen: ThemeProviderProps["splashScreen"] = {
    "Logo": OnyxiaSplashScreenLogo
};

export const { PageHeader } = createPageHeader({ Icon });

export const { ButtonBarButton } = createButtonBarButton({ Icon });
export const { ButtonBar } = createButtonBar({ Icon });
export const { LanguageSelect } = createLanguageSelect<Language>({
    "languagesPrettyPrint": {
        "en": "English",
        "fr": "Français",
        "zh-CN": "简体中文",
        "no": "Norsk",
        "fi": "Suomi",
        "nl": "Nederlands",
        "it": "Italiano"
    }
});

export const { LeftBar } = createLeftBar({
    Icon,
    "persistIsPanelOpen": true,
    "defaultIsPanelOpen": true
});
