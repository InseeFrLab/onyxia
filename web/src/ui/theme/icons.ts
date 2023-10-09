import { ReactComponent as TourSvg } from "ui/assets/svg/Tour.svg";
import { ReactComponent as ServicesSvg } from "ui/assets/svg/Services.svg";
import { ReactComponent as SecretsSvg } from "ui/assets/svg/Secrets.svg";
import { ReactComponent as AccountSvg } from "ui/assets/svg/Account2.svg";
import { ReactComponent as HomeSvg } from "ui/assets/svg/Home2.svg";
import { ReactComponent as FilesSvg } from "ui/assets/svg/Files.svg";
import { ReactComponent as CollaborationToolsSvg } from "ui/assets/svg/CollaborationTools.svg";
import { ReactComponent as BashSvg } from "ui/assets/svg/Bash.svg";
import { ReactComponent as CatalogSvg } from "ui/assets/svg/Catalog.svg";
import { ReactComponent as KeySvg } from "ui/assets/svg/Key.svg";
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

/** @see: <https://next.material-ui.com/components/material-icons/> */
export const componentByIconId = {
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
} as const;

export type IconId = keyof typeof componentByIconId;
