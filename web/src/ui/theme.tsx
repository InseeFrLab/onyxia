import {
    createThemeProvider,
    defaultPalette,
    francePalette,
    ultravioletPalette,
    verdantPalette,
    defaultGetTypographyDesc
} from "onyxia-ui";
import type { ThemeProviderProps } from "onyxia-ui";
import { createIcon } from "onyxia-ui/Icon";
import { createIconButton } from "onyxia-ui/IconButton";
import { createButton } from "onyxia-ui/Button";
import { createButtonBarButton } from "onyxia-ui/ButtonBarButton";
import { createButtonBar } from "onyxia-ui/ButtonBar";
import { createText } from "onyxia-ui/Text";
import { createPageHeader } from "onyxia-ui/PageHeader";
import { createTss } from "tss-react";
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
import ScreenRotationIcon from "@mui/icons-material/ScreenRotation";
import type { Param0 } from "tsafe/Param0";
import type { Language } from "ui/i18n";
import { createOnyxiaSplashScreenLogo } from "onyxia-ui/lib/SplashScreen";
import { THEME_ID, PALETTE_OVERRIDE } from "keycloak-theme/login/envCarriedOverToKc";
import { mergeDeep } from "./tools/mergeDeep";

const palette = {
    ...(() => {
        const selectedBuiltinPalette = (() => {
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
        })();

        return PALETTE_OVERRIDE !== undefined
            ? mergeDeep(selectedBuiltinPalette, PALETTE_OVERRIDE)
            : selectedBuiltinPalette;
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
};

export const targetWindowInnerWidth = 1980;

const { ThemeProvider, useTheme } = createThemeProvider({
    "getTypographyDesc": params => ({
        ...defaultGetTypographyDesc({
            // We don't want the font to be responsive
            "windowInnerWidth": targetWindowInnerWidth,
            "rootFontSizePx": params.rootFontSizePx
        }),
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
    palette
});

export { ThemeProvider };

export const { tss } = createTss({
    "useContext": function useContext() {
        const theme = useTheme();
        return { theme };
    }
});

export const useStyles = tss.create({});

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
    "refresh": RefreshLogoSvg,
    "screenRotation": ScreenRotationIcon
});

export type IconId = Param0<typeof Icon>["iconId"];

export const { IconButton } = createIconButton({ Icon });
export const { Button } = createButton({ Icon });
export const { Text } = createText({ useTheme });

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
        "de": "Deutsch",
        "it": "Italiano",
        "nl": "Nederlands",
        "no": "Norsk",
        "fi": "Suomi",
        "zh-CN": "简体中文"
    }
});

export const { LeftBar } = createLeftBar({
    Icon,
    "persistIsPanelOpen": true,
    "defaultIsPanelOpen": true
});

export function applyFaviconColor() {
    const color = palette.focus.main;

    // Define the SVG as a string
    const svg = `<svg viewBox="43 35 360 225.88" xmlns="http://www.w3.org/2000/svg">
                  <g fill="${color}">
                    <path d="M106.253 215.9L140.204 250.02C151.012 260.883 168.528 260.883 179.322 250.02L213.273 215.9L159.763 162.123L106.253 215.9Z"  />
                    <path d="M232.743 215.9L266.693 250.02C277.502 260.883 295.018 260.883 305.812 250.02L339.762 215.9L286.253 162.123L232.743 215.9Z"  />
                  </g>
                  <g fill="${color}">
                    <path d="M43 152.331L76.9508 186.452C87.7594 197.314 105.275 197.314 116.069 186.452L150.02 152.331L96.5099 98.5537L43 152.331Z"  />
                    <path d="M169.49 152.331L203.441 186.452C214.25 197.314 231.765 197.314 242.559 186.452L276.51 152.331L223 98.5537L169.49 152.331Z"  />
                    <path d="M349.49 98.5537L295.98 152.331L329.931 186.452C340.74 197.314 358.256 197.314 369.049 186.452L403 152.331L349.49 98.5537Z"  />
                  </g>
                  <g fill="${color}">
                    <path d="M232.743 88.7774L266.693 122.898C277.502 133.761 295.018 133.761 305.812 122.898L339.762 88.7774L286.253 35L232.743 88.7774Z"  />
                    <path d="M106.253 88.7774L140.204 122.898C151.012 133.761 168.528 133.761 179.322 122.898L213.273 88.7774L159.763 35L106.253 88.7774Z"  />   
                  </g>
                </svg>`;

    // Create a data URL from the SVG
    const url = "data:image/svg+xml," + encodeURIComponent(svg);

    // Set the favicon
    const link: any = document.querySelector("link[rel*='icon']");
    link.type = "image/svg+xml";
    link.href = url;

    // This is necessary in case a favicon already exists
    document.getElementsByTagName("head")[0].appendChild(link);
}
