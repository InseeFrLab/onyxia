import { useId, useState, memo, Fragment, type JSX } from "react";
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
import { assert, type Equals } from "tsafe/assert";
import { useResolveLocalizedString, type LocalizedString } from "ui/i18n";
import { getIconUrlByName } from "lazy-icons";
import { same } from "evt/tools/inDepth/same";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";

type SourceUrls = {
    helmChartSourceUrl?: string;
    helmChartRepositorySourceUrl?: string;
};

export type Props = {
    className?: string;
    chartName: string;
    chartSourceLinksNode: JSX.Element;
    chartIconUrl: string | undefined;
    isBookmarked: boolean;
    willOverwriteExistingConfigOnSave: boolean;

    chartVersion: string;

    availableChartVersions: string[];
    onChartVersionChange: (chartVersion: string) => void;
    catalogName: LocalizedString;
    labeledHelmChartSourceUrls: Pick<
        SourceUrls,
        "helmChartSourceUrl" | "helmChartRepositorySourceUrl"
    >;

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

    onRequestLaunch: () => void;
    onRequestCancel: () => void;

    //Undefined when the configuration is the default one
    onRequestRestoreAllDefault: (() => void) | undefined;

    //Undefined when the configuration is the default one
    onRequestCopyLaunchUrl: (() => void) | undefined;

    s3ConfigsSelect:
        | {
              projectS3ConfigLink: Link;
              selectedOption: string | undefined;
              options: string[];
              onSelectedS3ConfigChange: (params: { s3ConfigId: string }) => void;
          }
        | undefined;

    erroredFormFields: (string | number)[][];
    dataTextEditorErrorMsg: string | undefined;
};

export const LauncherMainCard = memo((props: Props) => {
    const {
        className,
        chartName,
        chartSourceLinksNode,
        chartIconUrl,
        isBookmarked,
        willOverwriteExistingConfigOnSave,

        chartVersion,
        availableChartVersions,
        onChartVersionChange,
        catalogName,
        labeledHelmChartSourceUrls,

        myServicesSavedConfigsExtendedLink,
        friendlyName,
        isSharedWrap,
        onRequestToggleBookmark,
        onFriendlyNameChange,
        onRequestLaunch,
        onRequestCancel,
        onRequestCopyLaunchUrl,
        onRequestRestoreAllDefault,

        s3ConfigsSelect,
        erroredFormFields,
        dataTextEditorErrorMsg
    } = props;

    const { classes, cx } = useStyles();

    const { t } = useTranslation({ LauncherMainCard });

    const onValueBeingTypedChange = useConstCallback<
        TextFieldProps["onValueBeingTypedChange"]
    >(({ value }) => onFriendlyNameChange(value));

    const { resolveLocalizedString } = useResolveLocalizedString({
        labelWhenMismatchingLanguage: true
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
                <div className={classes.aboveDividerFirstLine}>
                    <div className={classes.logoAndTitleWrapper}>
                        {chartIconUrl !== undefined && (
                            <RoundLogo url={chartIconUrl} size="large" />
                        )}
                        <Text typo="object heading" className={classes.title}>
                            {capitalize(chartName)}
                        </Text>
                    </div>

                    <div style={{ flex: 1 }} />

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
                                            icon={getIconUrlByName("Check")}
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
                                startIcon={getIconUrlByName("Link")}
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
                                icon={isBookmarked ? DeleteIcon : SaveIcon}
                                onClick={onRequestToggleBookmark}
                            />
                        ) : willOverwriteExistingConfigOnSave && !isBookmarked ? (
                            <Button
                                className={classes.saveButton}
                                variant="ternary"
                                startIcon={getIconUrlByName("Save")}
                                onClick={onRequestToggleBookmark}
                            >
                                {t("save changes")}
                            </Button>
                        ) : (
                            <Button
                                className={classes.saveButton}
                                variant="ternary"
                                startIcon={getIconUrlByName(
                                    isBookmarked ? "Delete" : "Save"
                                )}
                                onClick={onRequestToggleBookmark}
                            >
                                {t("bookmark button", { isBookmarked })}
                            </Button>
                        )}
                    </Tooltip>
                </div>
                <Text typo="caption" color="secondary">
                    {chartSourceLinksNode}
                </Text>
            </div>
            <div className={classes.belowDivider}>
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
                                    helmCharName: chartName,
                                    helmRepositoryName:
                                        resolveLocalizedString(catalogName),
                                    labeledHelmChartSourceUrls
                                })}
                            >
                                <Icon
                                    className={classes.versionSelectHelpIcon}
                                    icon={getIconUrlByName("Help")}
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
                                        projectS3ConfigLink:
                                            s3ConfigsSelect.projectS3ConfigLink
                                    })}
                                >
                                    <Icon
                                        className={classes.versionSelectHelpIcon}
                                        icon={getIconUrlByName("Help")}
                                        size="small"
                                    />
                                </Tooltip>
                            </InputLabel>
                            <Select
                                labelId={s3ConfigInputLabelId}
                                value={s3ConfigsSelect.selectedOption ?? ""}
                                onChange={event => {
                                    const { value } = event.target;
                                    assert(typeof value === "string");
                                    s3ConfigsSelect.onSelectedS3ConfigChange({
                                        s3ConfigId: value
                                    });
                                }}
                            >
                                <MenuItem value={""} disabled>
                                    {" "}
                                </MenuItem>
                                {s3ConfigsSelect.options.map(profileName => (
                                    <MenuItem key={profileName} value={profileName}>
                                        {profileName}
                                    </MenuItem>
                                ))}
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
                                                isShared: event.target.checked
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

                    <div style={{ flex: 1 }} />
                    <Button variant="secondary" onClick={onRequestCancel}>
                        {t("cancel")}
                    </Button>

                    <LaunchButton
                        className={classes.launchButton}
                        tLaunch={t("launch")}
                        tProblemWithTheFollowingValues={t("problem with")}
                        onRequestLaunch={onRequestLaunch}
                        erroredFormFields={erroredFormFields}
                        dataTextEditorErrorMsg={dataTextEditorErrorMsg}
                    />
                </div>
            </div>
        </div>
    );
}, same);

function LaunchButton(props: {
    className?: string;
    tLaunch: string;
    tProblemWithTheFollowingValues: string;
    onRequestLaunch: () => void;
    erroredFormFields: (string | number)[][];
    dataTextEditorErrorMsg: string | undefined;
}) {
    const {
        className,
        tLaunch,
        tProblemWithTheFollowingValues,
        onRequestLaunch,
        erroredFormFields,
        dataTextEditorErrorMsg
    } = props;

    const renderButton = (params: { isDisabled: boolean }) => {
        const { isDisabled } = params;

        return (
            <Button
                variant="primary"
                onClick={onRequestLaunch}
                className={className}
                disabled={isDisabled}
            >
                {tLaunch}
            </Button>
        );
    };

    if (erroredFormFields.length === 0 && dataTextEditorErrorMsg === undefined) {
        return renderButton({ isDisabled: false });
    }

    return (
        <Tooltip
            title={
                <>
                    <Text typo="body 1">
                        {(() => {
                            if (dataTextEditorErrorMsg !== undefined) {
                                return dataTextEditorErrorMsg;
                            }

                            return (
                                <>
                                    {tProblemWithTheFollowingValues}
                                    <br />
                                    {erroredFormFields.map((helmValuesPath, i) => (
                                        <Fragment key={i}>
                                            <span>
                                                {helmValuesPath.reduce<string>(
                                                    (prev, curr) => {
                                                        switch (typeof curr) {
                                                            case "string":
                                                                if (prev === "") {
                                                                    return curr;
                                                                }
                                                                return `${prev}.${curr}`;
                                                            case "number":
                                                                return `${prev}[${curr}]`;
                                                        }
                                                        assert<
                                                            Equals<typeof curr, never>
                                                        >();
                                                    },
                                                    ""
                                                )}
                                            </span>
                                            {i < erroredFormFields.length - 1 && (
                                                <>
                                                    ,<br />
                                                </>
                                            )}
                                        </Fragment>
                                    ))}
                                </>
                            );
                        })()}
                    </Text>
                </>
            }
        >
            <span style={{ display: "inline-block" }}>
                {renderButton({ isDisabled: true })}
            </span>
        </Tooltip>
    );
}

LauncherMainCard.displayName = symToStr({ LauncherMainCard });

const { i18n } = declareComponentKeys<
    | "cancel"
    | "launch"
    | "problem with"
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
              labeledHelmChartSourceUrls: Props["labeledHelmChartSourceUrls"];
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
    root: {
        borderRadius: 8,
        boxShadow: theme.shadows[7],
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        display: "flex",
        flexDirection: "column"
    },
    aboveDivider: {
        padding: theme.spacing({ topBottom: 3, rightLeft: 4 }),
        borderBottom: `1px solid ${theme.colors.useCases.typography.textTertiary}`,
        boxSizing: "border-box"
    },
    aboveDividerFirstLine: {
        display: "flex",
        marginBottom: theme.spacing(3)
    },
    belowDivider: {
        padding: theme.spacing(4),
        paddingLeft: theme.spacing(5),
        flex: 1
    },
    logoAndTitleWrapper: {
        display: "flex"
    },
    title: {
        display: "flex",
        alignItems: "center",
        marginLeft: theme.spacing(3)
    },
    textFieldAndButtonWrapper: {
        display: "flex",
        alignItems: "center"
    },
    versionSelectWrapper: {
        minWidth: 200,
        marginLeft: theme.spacing(4)
    },
    versionSelectHelpIcon: {
        position: "relative",
        top: 2
    },
    isSharedWrapper: {
        marginLeft: theme.spacing(4)
    },
    isSharedCheckbox: {
        padding: theme.spacing(2)
    },
    isSharedFormHelperText: {
        marginLeft: 0
    },
    launchButton: {
        marginLeft: theme.spacing(2)
    },
    copyCheckmark: {
        color: theme.colors.useCases.alertSeverity.success.main
    },
    copyAutoLaunchButton: {
        marginLeft: theme.spacing(2)
    },
    saveButton: {
        marginLeft: theme.spacing(2)
    }
}));
