import { useId, useState, memo } from "react";
import { tss } from "tss";
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
import { same } from "evt/tools/inDepth/same";
import type { SourceUrls } from "core/usecases/launcher/selectors";

export type Props = {
    className?: string;
    chartName: string;
    chartIconUrl: string | undefined;
    isBookmarked: boolean;
    willOverwriteExistingConfigOnSave: boolean;

    chartVersion: string;

    availableChartVersions: string[];
    onChartVersionChange: (chartVersion: string) => void;
    catalogName: LocalizedString;
    sourceUrls: Pick<SourceUrls, "helmChartSourceUrl" | "helmChartRepositorySourceUrl">;

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

    s3ConfigsSelect:
        | {
              projectS3ConfigLink: Link;
              selectedOption:
                  | {
                        type: "sts";
                    }
                  | {
                        type: "custom";
                        customS3ConfigIndex: number;
                    }
                  | {
                        type: "manual form input";
                    };
              options: {
                  customConfigIndex: number | undefined;
                  dataSource: string;
                  accountFriendlyName: string | undefined;
              }[];
              onSelectedS3ConfigChange: (
                  params:
                      | {
                            type: "default";
                            customS3ConfigIndex?: never;
                        }
                      | {
                            type: "custom";
                            customS3ConfigIndex: number;
                        }
              ) => void;
          }
        | undefined;
};

export const LauncherMainCard = memo((props: Props) => {
    const {
        className,
        chartName,
        chartIconUrl,
        isBookmarked,
        willOverwriteExistingConfigOnSave,

        chartVersion,
        availableChartVersions,
        onChartVersionChange,
        catalogName,
        sourceUrls,

        myServicesSavedConfigsExtendedLink,
        friendlyName,
        isSharedWrap,
        isLaunchable,
        onRequestToggleBookmark,
        onFriendlyNameChange,
        onRequestLaunch,
        onRequestCancel,
        onRequestCopyLaunchUrl,
        onRequestRestoreAllDefault,

        s3ConfigsSelect
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
    const s3ConfigInputLabelId = `s3Config-input-label-${useId()}`;

    const { isCopyFeedbackOn, triggerCopyFeedback } = (function useClosure() {
        const [isCopyFeedbackOn, setIsCopyFeedbackOn] = useState(false);

        const triggerCopyFeedback = useConstCallback(() => {
            setIsCopyFeedbackOn(true);
            setTimeout(() => setIsCopyFeedbackOn(false), 1000);
        });

        return { isCopyFeedbackOn, triggerCopyFeedback };
    })();

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.aboveDivider}>
                <Text typo="object heading" className={classes.cardTitle}>
                    {t("card title")}
                </Text>
                <div style={{ "flex": 1 }} />

                {onRequestRestoreAllDefault !== undefined && (
                    <Button variant="ternary" onClick={onRequestRestoreAllDefault}>
                        {t("restore all default")}
                    </Button>
                )}
                {onRequestCopyLaunchUrl !== undefined && (
                    <Tooltip
                        title={
                            isCopyFeedbackOn ? (
                                <>
                                    <Icon
                                        icon={id<MuiIconComponentName>("Check")}
                                        size="extra small"
                                        className={classes.copyCheckmark}
                                    />
                                    &nbsp;
                                    {t("copied to clipboard")}
                                </>
                            ) : (
                                t("copy auto launch url helper", { chartName })
                            )
                        }
                    >
                        <Button
                            className={classes.copyAutoLaunchButton}
                            startIcon={id<MuiIconComponentName>("Link")}
                            onClick={() => {
                                onRequestCopyLaunchUrl();
                                triggerCopyFeedback();
                            }}
                            variant="ternary"
                        >
                            {t("copy auto launch url")}
                        </Button>
                    </Tooltip>
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
                    ) : willOverwriteExistingConfigOnSave && !isBookmarked ? (
                        <Button
                            className={classes.saveButton}
                            variant="ternary"
                            startIcon="save"
                            onClick={onRequestToggleBookmark}
                        >
                            {t("save changes")}
                        </Button>
                    ) : (
                        <Button
                            className={classes.saveButton}
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
                                    "helmCharName": chartName,
                                    "helmRepositoryName":
                                        resolveLocalizedString(catalogName),
                                    sourceUrls
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

                    {s3ConfigsSelect !== undefined && (
                        <FormControl
                            variant="standard"
                            className={classes.versionSelectWrapper}
                        >
                            <InputLabel id={s3ConfigInputLabelId}>
                                {t("s3 configuration")}&nbsp;
                                <Tooltip
                                    title={t("s3 configuration - explain", {
                                        "projectS3ConfigLink":
                                            s3ConfigsSelect.projectS3ConfigLink
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
                                labelId={s3ConfigInputLabelId}
                                value={(() => {
                                    switch (s3ConfigsSelect.selectedOption.type) {
                                        case "custom":
                                            return `${s3ConfigsSelect.selectedOption.customS3ConfigIndex}`;
                                        case "sts":
                                            return "sts";
                                        case "manual form input":
                                            return "manual form input";
                                    }
                                })()}
                                onChange={event => {
                                    const { value } = event.target;
                                    assert(typeof value === "string");

                                    if (value === "sts") {
                                        s3ConfigsSelect.onSelectedS3ConfigChange({
                                            "type": "default"
                                        });
                                        return;
                                    }

                                    const customS3ConfigIndex = parseInt(value);

                                    s3ConfigsSelect.onSelectedS3ConfigChange({
                                        "type": "custom",
                                        customS3ConfigIndex
                                    });
                                }}
                            >
                                {s3ConfigsSelect.selectedOption.type ===
                                    "manual form input" && (
                                    <MenuItem disabled value="manual form input">
                                        &nbsp;
                                    </MenuItem>
                                )}

                                {s3ConfigsSelect.options.map(
                                    ({
                                        accountFriendlyName,
                                        customConfigIndex,
                                        dataSource
                                    }) => (
                                        <MenuItem
                                            key={customConfigIndex ?? "_"}
                                            value={`${customConfigIndex ?? "sts"}`}
                                        >
                                            {accountFriendlyName !== undefined
                                                ? `${accountFriendlyName} - `
                                                : ""}
                                            {dataSource}
                                        </MenuItem>
                                    )
                                )}
                            </Select>
                        </FormControl>
                    )}

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
}, same);

LauncherMainCard.displayName = symToStr({ LauncherMainCard });

const { i18n } = declareComponentKeys<
    | "card title"
    | "cancel"
    | "launch"
    | "friendly name"
    | "copy auto launch url"
    | {
          K: "copy auto launch url helper";
          P: {
              chartName: string;
          };
      }
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
    | "version select label"
    | {
          K: "version select helper text";
          P: {
              helmCharName: string;
              helmRepositoryName: JSX.Element;
              sourceUrls: Props["sourceUrls"];
          };
          R: JSX.Element;
      }
    | "save changes"
    | "copied to clipboard"
    | "s3 configuration"
    | {
          K: "s3 configuration - explain";
          P: { projectS3ConfigLink: Link };
          R: JSX.Element;
      }
>()({ LauncherMainCard });
export type I18n = typeof i18n;

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
    "copyCheckmark": {
        "color": theme.colors.useCases.alertSeverity.success.main
    },
    "copyAutoLaunchButton": {
        "marginLeft": theme.spacing(2)
    },
    "saveButton": {
        "marginLeft": theme.spacing(2)
    }
}));
