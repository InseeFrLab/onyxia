import { useState, Fragment, useMemo, memo } from "react";
import { tss } from "tss";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";
import { Icon } from "onyxia-ui/Icon";
import { IconButton } from "onyxia-ui/IconButton";
import { useTranslation } from "ui/i18n";
import { capitalize } from "tsafe/capitalize";
import { MyServicesRoundLogo } from "./MyServicesRoundLogo";
import { MyServicesRunningTime } from "./MyServicesRunningTime";
import { Tooltip } from "onyxia-ui/Tooltip";
import { declareComponentKeys } from "i18nifty";
import { ReadmeDialog } from "./ReadmeDialog";
import { Evt, type NonPostableEvt } from "evt";
import { useConst } from "powerhooks/useConst";
import { useEvt } from "evt/hooks";
import { getIconUrlByName } from "lazy-icons";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import type { Link } from "type-route";
import type { Service } from "core/usecases/serviceManagement";
import { assert, type Equals } from "tsafe/assert";
import { TextField, type TextFieldProps } from "onyxia-ui/TextField";
import MuiLink from "@mui/material/Link";
import { env } from "env";

const THRESHOLD_MS = 1000 * 60 * 60 * env.RUNNING_TIME_THRESHOLD_HOURS;

function getDoesHaveBeenRunningForTooLong(params: { startTime: number }): boolean {
    const { startTime } = params;

    return Date.now() - startTime > THRESHOLD_MS;
}

export type Props = {
    className?: string;
    evtAction: NonPostableEvt<"open readme dialog">;
    onRequestDelete: () => void;
    onRequestPauseOrResume: () => void;
    onRequestLogHelmGetNotes: () => void;
    myServiceLink: Link;
    lastClusterEvent:
        | { message: string; severity: "error" | "info" | "warning" }
        | undefined;
    onOpenClusterEventsDialog: () => void;
    onRequestChangeFriendlyName: (friendlyName: string) => void;
    onRequestChangeSharedStatus: (isShared: boolean) => void;
    groupProjectName: string | undefined;
    service: Service;
};

export const MyServicesCard = memo((props: Props) => {
    const {
        className,
        evtAction,
        onRequestDelete,
        onRequestPauseOrResume,
        onRequestLogHelmGetNotes,
        myServiceLink,
        lastClusterEvent,
        onOpenClusterEventsDialog,
        onRequestChangeFriendlyName,
        onRequestChangeSharedStatus,
        groupProjectName,
        service
    } = props;

    const { t } = useTranslation({ MyServicesCard });

    const severity = useMemo(() => {
        switch (service.state) {
            case "failed":
                return "error";
            case "starting":
            case "suspending":
            case "suspended":
                return "pending";
            case "running":
                return getDoesHaveBeenRunningForTooLong({
                    startTime: service.startedAt
                })
                    ? "warning"
                    : "success";
        }

        assert<Equals<typeof service.state, never>>(false);
    }, [service]);

    const isServiceTitleALink =
        service.state === "running" && !service.areInteractionLocked;

    const { classes, cx, theme } = useStyles({
        hasBeenRunningForTooLong: severity === "warning",
        isServiceTitleALink
    });

    const evtOpenReadmeDialog = useConst(() => Evt.create());

    useEvt(
        ctx => {
            evtAction.attach(
                action => action === "open readme dialog",
                ctx,
                async () => {
                    if (service.postInstallInstructions === undefined) {
                        return;
                    }
                    evtOpenReadmeDialog.post();
                }
            );
        },
        [evtAction]
    );

    const [isEditingFriendlyName, setIsEditingFriendlyName] = useState(false);

    const evtFriendlyNameTextFieldAction = useConst(() =>
        Evt.create<TextFieldProps["evtAction"]>()
    );

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.aboveDivider}>
                <MyServicesRoundLogo url={service.iconUrl} severity={severity} />
                {isEditingFriendlyName ? (
                    <TextField
                        className={classes.friendlyNameTextField}
                        inputProps_autoFocus={true}
                        selectAllTextOnFocus={true}
                        defaultValue={capitalize(service.friendlyName)}
                        evtAction={evtFriendlyNameTextFieldAction}
                        onEnterKeyDown={() =>
                            evtFriendlyNameTextFieldAction.post("TRIGGER SUBMIT")
                        }
                        onSubmit={friendlyName => {
                            setIsEditingFriendlyName(false);

                            onRequestChangeFriendlyName(friendlyName);
                        }}
                        onEscapeKeyDown={() => {
                            setIsEditingFriendlyName(false);
                        }}
                    />
                ) : (
                    <MuiLink {...myServiceLink}>
                        <Text className={classes.title} typo="object heading">
                            {capitalize(service.friendlyName)}
                        </Text>
                    </MuiLink>
                )}
                {isEditingFriendlyName ? (
                    <IconButton
                        icon={getIconUrlByName("Check")}
                        onClick={() =>
                            evtFriendlyNameTextFieldAction.post("TRIGGER SUBMIT")
                        }
                    />
                ) : (
                    <IconButton
                        icon={getIconUrlByName("Edit")}
                        disabled={service.areInteractionLocked}
                        onClick={() => setIsEditingFriendlyName(true)}
                    />
                )}
                <div style={{ flex: 1 }} />
                {(() => {
                    if (groupProjectName === undefined) {
                        return null;
                    }

                    if (!service.ownership.isOwned) {
                        return (
                            <Tooltip
                                title={t("share tooltip - belong to someone else", {
                                    ownerUsername: service.ownership.ownerUsername,
                                    projectName: groupProjectName,
                                    focusColor: theme.colors.useCases.typography.textFocus
                                })}
                            >
                                <Icon icon={getIconUrlByName("Diversity3")} />
                            </Tooltip>
                        );
                    }

                    if (service.ownership.isShared) {
                        return (
                            <Tooltip
                                title={t("share tooltip - belong to you, shared", {
                                    projectName: groupProjectName,
                                    focusColor: theme.colors.useCases.typography.textFocus
                                })}
                            >
                                <IconButton
                                    disabled={service.areInteractionLocked}
                                    onClick={() => onRequestChangeSharedStatus(false)}
                                    icon={getIconUrlByName("Diversity3")}
                                />
                            </Tooltip>
                        );
                    }

                    return (
                        <Tooltip
                            title={t("share tooltip - belong to you, not shared", {
                                projectName: groupProjectName,
                                focusColor: theme.colors.useCases.typography.textFocus
                            })}
                        >
                            <IconButton
                                disabled={service.areInteractionLocked}
                                onClick={() => onRequestChangeSharedStatus(true)}
                                icon={getIconUrlByName("AdminPanelSettings")}
                            />
                        </Tooltip>
                    );
                })()}
                <Tooltip
                    title={
                        <Fragment key={"reminder"}>
                            {t("reminder to delete services")}
                        </Fragment>
                    }
                >
                    <Icon
                        icon={getIconUrlByName("ErrorOutline")}
                        className={classes.errorOutlineIcon}
                    />
                </Tooltip>
            </div>
            <div className={classes.belowDivider}>
                <div className={classes.belowDividerTop}>
                    <div>
                        <Text typo="caption" className={classes.captions}>
                            {t("service")}
                        </Text>
                        <div className={classes.packageNameWrapper}>
                            <Text typo="label 1">{capitalize(service.chartName)}</Text>
                        </div>
                    </div>
                    <div className={classes.timeAndStatusContainer}>
                        <Text typo="caption" className={classes.captions}>
                            {service.state === "running"
                                ? t("running since")
                                : t("status")}
                        </Text>
                        {(() => {
                            switch (service.state) {
                                case "failed":
                                    return <Text typo="label 1">{t("failed")}</Text>;
                                case "suspended":
                                    return <Text typo="label 1">{t("suspended")}</Text>;
                                case "suspending":
                                    return (
                                        <Text typo="label 1">{t("suspending")}...</Text>
                                    );
                                case "starting":
                                    return (
                                        <Text typo="label 1">
                                            {t("container starting")}
                                            &nbsp;
                                            <CircularProgress
                                                className={classes.circularProgress}
                                                size={
                                                    theme.typography.variants["label 1"]
                                                        .style.fontSize
                                                }
                                            />
                                        </Text>
                                    );
                                case "running":
                                    return (
                                        <MyServicesRunningTime
                                            doesHaveBeenRunningForTooLong={getDoesHaveBeenRunningForTooLong(
                                                { startTime: service.startedAt }
                                            )}
                                            startTime={service.startedAt}
                                        />
                                    );
                            }
                            assert<Equals<typeof service.state, never>>(false);
                        })()}
                    </div>
                </div>
                <div className={classes.belowDividerBottom}>
                    {onRequestDelete !== undefined && (
                        <IconButton
                            disabled={service.areInteractionLocked}
                            icon={getIconUrlByName("Delete")}
                            onClick={onRequestDelete}
                        />
                    )}
                    {service.doesSupportSuspend && service.state === "running" && (
                        <Tooltip title={t("suspend service tooltip")}>
                            <span>
                                <IconButton
                                    disabled={service.areInteractionLocked}
                                    icon={getIconUrlByName("Pause")}
                                    onClick={event => {
                                        onRequestPauseOrResume();
                                        event.stopPropagation();
                                        event.preventDefault();
                                    }}
                                />
                            </span>
                        </Tooltip>
                    )}
                    <div style={{ flex: 1 }} />
                    {service.state === "suspended" && (
                        <Tooltip title={t("resume service tooltip")}>
                            <span>
                                <IconButton
                                    disabled={service.areInteractionLocked}
                                    icon={getIconUrlByName("PlayArrow")}
                                    onClick={onRequestPauseOrResume}
                                />
                            </span>
                        </Tooltip>
                    )}
                    {(service.state === "running" || service.state === "starting") &&
                        (service.openUrl !== undefined ||
                            service.postInstallInstructions !== undefined) && (
                            <Button
                                onClick={() => evtOpenReadmeDialog.post()}
                                variant={
                                    service.openUrl === undefined
                                        ? "ternary"
                                        : "secondary"
                                }
                            >
                                <span>
                                    {service.openUrl !== undefined
                                        ? capitalize(t("open"))
                                        : t("readme").toUpperCase()}
                                </span>
                            </Button>
                        )}
                </div>
            </div>
            <ReadmeDialog
                evtOpen={evtOpenReadmeDialog}
                isReady={service.state === "running"}
                openUrl={service.openUrl}
                servicePassword={service.servicePassword}
                postInstallInstructions={service.postInstallInstructions}
                onRequestLogHelmGetNotes={onRequestLogHelmGetNotes}
                lastClusterEvent={lastClusterEvent}
                onOpenClusterEventsDialog={onOpenClusterEventsDialog}
            />
        </div>
    );
});

const { i18n } = declareComponentKeys<
    | "service"
    | "running since"
    | "open"
    | "readme"
    | "reminder to delete services"
    | "status"
    | "container starting"
    | "failed"
    | "suspend service tooltip"
    | "resume service tooltip"
    | "suspended"
    | "suspending"
    | {
          K: "share tooltip - belong to someone else";
          P: { ownerUsername: string; projectName: string; focusColor: string };
          R: JSX.Element;
      }
    | {
          K: "share tooltip - belong to you, not shared";
          P: { projectName: string; focusColor: string };
          R: JSX.Element;
      }
    | {
          K: "share tooltip - belong to you, shared";
          P: { projectName: string; focusColor: string };
          R: JSX.Element;
      }
>()({ MyServicesCard });
export type I18n = typeof i18n;

const useStyles = tss
    .withParams<{
        hasBeenRunningForTooLong: boolean;
        isServiceTitleALink: boolean;
    }>()
    .withName({ MyServicesCard })
    .create(({ theme, hasBeenRunningForTooLong, isServiceTitleALink }) => ({
        root: {
            borderRadius: 8,
            boxShadow: theme.shadows[1],
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            "&:hover": {
                boxShadow: theme.shadows[6]
            },
            display: "flex",
            flexDirection: "column"
        },
        aboveDivider: {
            padding: theme.spacing({ topBottom: 3, rightLeft: 4 }),
            borderBottom: `1px solid ${theme.colors.useCases.typography.textTertiary}`,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            color: "inherit",
            textDecoration: "none"
        },
        title: {
            marginLeft: theme.spacing(3),
            "&:hover": {
                color: isServiceTitleALink
                    ? theme.colors.useCases.typography.textFocus
                    : undefined
            }
        },
        errorOutlineIcon: !hasBeenRunningForTooLong
            ? { display: "none" }
            : {
                  marginLeft: theme.spacing(3),
                  color: theme.colors.useCases.alertSeverity.warning.main
              },
        belowDivider: {
            padding: theme.spacing(4),
            paddingTop: theme.spacing(3),
            flex: 1
        },
        timeAndStatusContainer: {
            flex: 1,
            paddingLeft: theme.spacing(6)
        },
        circularProgress: {
            color: "inherit",
            position: "relative",
            top: 3,
            left: theme.spacing(2)
        },
        belowDividerTop: {
            display: "flex",
            marginBottom: theme.spacing(4)
        },
        captions: {
            display: "inline-block",
            marginBottom: theme.spacing(2)
        },
        packageNameWrapper: {
            "& > *": {
                display: "inline-block"
            }
        },
        belowDividerBottom: {
            display: "flex",
            alignItems: "center"
        },
        friendlyNameTextField: {
            marginLeft: theme.spacing(3)
        }
    }));
