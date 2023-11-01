import { useId, memo } from "react";
import { tss } from "ui/theme";
import { RoundLogo } from "ui/shared/RoundLogo";
import { useTranslation } from "ui/i18n";
import { IconButton } from "onyxia-ui/IconButton";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";
import { useConstCallback } from "powerhooks/useConstCallback";
import { TextField } from "onyxia-ui/TextField";
import type { TextFieldProps } from "onyxia-ui/TextField";
import { Tooltip } from "onyxia-ui/Tooltip";
import { Icon } from "onyxia-ui/Icon";
import { capitalize } from "tsafe/capitalize";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Checkbox from "@mui/material/Checkbox";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { declareComponentKeys } from "i18nifty";
import { symToStr } from "tsafe/symToStr";
import type { Link } from "type-route";
import { assert } from "tsafe/assert";
import { useResolveLocalizedString, type LocalizedString } from "ui/i18n";
import { id } from "tsafe/id";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";

export type Props = {
    className?: string;
    chartName: string;
    chartIconUrl: string | undefined;
    isBookmarked: boolean;
    isThereASavedConfigWithThisFriendlyName: boolean;

    chartVersion: string;

    availableChartVersions: string[];
    onChartVersionChange: (chartVersion: string) => void;
    catalogName: LocalizedString;
    catalogRepositoryUrl: string;

    myServicesSavedConfigsExtendedLink: Link;
    onRequestToggleBookmark: () => void;

    friendlyName: string;
    onFriendlyNameChange: (friendlyName: string) => void;

    isSharedWrap:
        | {
              isShared: boolean;
              onIsSharedValueChange: (params: { isShared: boolean }) => void;
          }
        | undefined;

    isLaunchable: boolean;

    onRequestLaunch: () => void;
    onRequestCancel: () => void;

    //Undefined when the configuration is the default one
    onRequestRestoreAllDefault: (() => void) | undefined;

    //Undefined when the configuration is the default one
    onRequestCopyLaunchUrl: (() => void) | undefined;
};

export const LauncherMainCard = memo((props: Props) => {
    const {
        className,
        chartName,
        chartIconUrl,
        isBookmarked,
        isThereASavedConfigWithThisFriendlyName,

        chartVersion,
        availableChartVersions,
        onChartVersionChange,
        catalogName,
        catalogRepositoryUrl,

        myServicesSavedConfigsExtendedLink,
        friendlyName,
        isSharedWrap,
        isLaunchable,
        onRequestToggleBookmark,
        onFriendlyNameChange,
        onRequestLaunch,
        onRequestCancel,
        onRequestCopyLaunchUrl,
        onRequestRestoreAllDefault
    } = props;

    const { classes, cx } = useStyles();

    const { t } = useTranslation({ LauncherMainCard });

    const onValueBeingTypedChange = useConstCallback<
        TextFieldProps["onValueBeingTypedChange"]
    >(({ value }) => onFriendlyNameChange(value));

    const { resolveLocalizedString } = useResolveLocalizedString({
        "labelWhenMismatchingLanguage": true
    });

    const chartVersionInputLabelId = `chart-version-input-label-${useId()}`;

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.aboveDivider}>
                <Text typo="object heading" className={classes.cardTitle}>
                    {t("card title")}
                </Text>
                <div style={{ "flex": 1 }} />

                {onRequestCopyLaunchUrl !== undefined && (
                    <Tooltip title={t("copy url helper text")}>
                        <IconButton
                            icon={id<MuiIconComponentName>("Link")}
                            onClick={onRequestCopyLaunchUrl}
                        />
                    </Tooltip>
                )}
                {onRequestRestoreAllDefault !== undefined && (
                    <Button variant="ternary" onClick={onRequestRestoreAllDefault}>
                        {t("restore all default")}
                    </Button>
                )}
                <Tooltip
                    title={t("bookmark button tooltip", {
                        myServicesSavedConfigsExtendedLink
                    })}
                >
                    {onRequestRestoreAllDefault === undefined && !isBookmarked ? (
                        <IconButton
                            icon={
                                isBookmarked
                                    ? id<MuiIconComponentName>("Delete")
                                    : id<MuiIconComponentName>("Save")
                            }
                            onClick={onRequestToggleBookmark}
                        />
                    ) : isThereASavedConfigWithThisFriendlyName && !isBookmarked ? (
                        <Button
                            className={classes.bookmarkButton}
                            variant="ternary"
                            startIcon="save"
                            onClick={onRequestToggleBookmark}
                        >
                            {t("save changes")}
                        </Button>
                    ) : (
                        <Button
                            className={classes.bookmarkButton}
                            variant="ternary"
                            startIcon={isBookmarked ? "delete" : "save"}
                            onClick={onRequestToggleBookmark}
                        >
                            {t("bookmark button", { isBookmarked })}
                        </Button>
                    )}
                </Tooltip>
            </div>
            <div className={classes.belowDivider}>
                <div className={classes.logoAndTitleWrapper}>
                    {chartIconUrl !== undefined && (
                        <RoundLogo url={chartIconUrl} size="large" />
                    )}
                    <Text typo="object heading" className={classes.title}>
                        {capitalize(chartName)}
                    </Text>
                </div>
                <div className={classes.textFieldAndButtonWrapper}>
                    <TextField
                        label={t("friendly name")}
                        defaultValue={friendlyName}
                        doOnlyValidateInputAfterFistFocusLost={false}
                        selectAllTextOnFocus={true}
                        inputProps_spellCheck={false}
                        onValueBeingTypedChange={onValueBeingTypedChange}
                    />
                    <FormControl
                        variant="standard"
                        className={classes.versionSelectWrapper}
                    >
                        <InputLabel id={chartVersionInputLabelId}>
                            {t("version select label")}&nbsp;
                            <Tooltip
                                title={t("version select helper text", {
                                    chartName,
                                    "catalogName": resolveLocalizedString(catalogName),
                                    catalogRepositoryUrl
                                })}
                            >
                                <Icon
                                    className={classes.versionSelectHelpIcon}
                                    icon={id<MuiIconComponentName>("Help")}
                                    size="small"
                                />
                            </Tooltip>
                        </InputLabel>
                        <Select
                            labelId={chartVersionInputLabelId}
                            value={chartVersion}
                            onChange={event => {
                                const { value: chartVersion } = event.target;
                                assert(typeof chartVersion === "string");
                                onChartVersionChange(chartVersion);
                            }}
                        >
                            {availableChartVersions.map(value => (
                                <MenuItem key={value} value={value}>
                                    {value}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {isSharedWrap !== undefined && (
                        <FormControl className={classes.isSharedWrapper}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        className={classes.isSharedCheckbox}
                                        color="primary"
                                        checked={isSharedWrap.isShared}
                                        onChange={event =>
                                            isSharedWrap.onIsSharedValueChange({
                                                "isShared": event.target.checked
                                            })
                                        }
                                    />
                                }
                                label={t("share the service")}
                            />
                            {
                                <FormHelperText
                                    className={classes.isSharedFormHelperText}
                                >
                                    {t("share the service - explain")}
                                </FormHelperText>
                            }
                        </FormControl>
                    )}

                    <div style={{ "flex": 1 }} />
                    <Button variant="secondary" onClick={onRequestCancel}>
                        {t("cancel")}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onRequestLaunch}
                        className={classes.launchButton}
                        disabled={!isLaunchable}
                    >
                        {t("launch")}
                    </Button>
                </div>
            </div>
        </div>
    );
});

LauncherMainCard.displayName = symToStr({ LauncherMainCard });

export const { i18n } = declareComponentKeys<
    | "card title"
    | "cancel"
    | "launch"
    | "friendly name"
    | "copy url helper text"
    | "share the service"
    | "share the service - explain"
    | "restore all default"
    | {
          K: "bookmark button tooltip";
          P: { myServicesSavedConfigsExtendedLink: Link };
          R: JSX.Element;
      }
    | {
          K: "bookmark button";
          P: { isBookmarked: boolean };
      }
    // Version
    | "version select label"
    /*
        Version of the {chartName} Chart in the 
        <MuiLink href={catalogRepositoryUrl}>{resolveLocalizedString(catalogName)} Helm Repository </MuiLink>
    */
    | {
          K: "version select helper text";
          P: {
              chartName: string;
              catalogName: JSX.Element;
              catalogRepositoryUrl: string;
          };
          R: JSX.Element;
      }
    | "save changes"
>()({ LauncherMainCard });

const useStyles = tss.withName({ LauncherMainCard }).create(({ theme }) => ({
    "root": {
        "borderRadius": 8,
        "boxShadow": theme.shadows[7],
        "backgroundColor": theme.colors.useCases.surfaces.surface1,
        "display": "flex",
        "flexDirection": "column"
    },
    "aboveDivider": {
        "padding": theme.spacing({ "topBottom": 3, "rightLeft": 4 }),
        "borderBottom": `1px solid ${theme.colors.useCases.typography.textTertiary}`,
        "boxSizing": "border-box",
        "display": "flex"
    },
    "cardTitle": {
        "display": "flex",
        "alignItems": "center"
    },
    "belowDivider": {
        "padding": theme.spacing(4),
        "paddingLeft": theme.spacing(5),
        "paddingTop": theme.spacing(3),
        "flex": 1
    },
    "logoAndTitleWrapper": {
        "display": "flex",
        "marginBottom": theme.spacing(3)
    },
    "title": {
        "display": "flex",
        "alignItems": "center",
        "marginLeft": theme.spacing(3)
    },
    "textFieldAndButtonWrapper": {
        "display": "flex",
        "alignItems": "center"
    },
    "versionSelectWrapper": {
        "minWidth": 200,
        "marginLeft": theme.spacing(4)
    },
    "versionSelectHelpIcon": {
        "position": "relative",
        "top": 2
    },
    "isSharedWrapper": {
        "marginLeft": theme.spacing(4)
    },
    "isSharedCheckbox": {
        "padding": theme.spacing(2)
    },
    "isSharedFormHelperText": {
        "marginLeft": 0
    },
    "launchButton": {
        "marginLeft": theme.spacing(2)
    },
    "bookmarkButton": {
        "marginLeft": theme.spacing(2)
    }
}));
