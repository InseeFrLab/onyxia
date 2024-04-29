import { Fragment, useMemo, memo } from "react";
import { tss } from "tss";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";
import { Icon } from "onyxia-ui/Icon";
import { IconButton } from "onyxia-ui/IconButton";
import { useTranslation } from "ui/i18n";
import { capitalize } from "tsafe/capitalize";
import { MyServicesRoundLogo } from "./MyServicesRoundLogo";
import { MyServicesRunningTime } from "./MyServicesRunningTime";
import { Tag } from "onyxia-ui/Tag";
import { Tooltip } from "onyxia-ui/Tooltip";
import { declareComponentKeys } from "i18nifty";
import { ReadmeDialog } from "./ReadmeDialog";
import { Evt, NonPostableEvt } from "evt";
import { useConst } from "powerhooks/useConst";
import { useEvt } from "evt/hooks";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe/id";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import type { Link } from "type-route";
import type { Service } from "core/usecases/serviceManagement";
import { assert, type Equals } from "tsafe/assert";

const runningTimeThreshold = 7 * 24 * 3600 * 1000;

function getDoesHaveBeenRunningForTooLong(params: { startTime: number }): boolean {
    const { startTime } = params;

    return Date.now() - startTime > runningTimeThreshold;
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
    projectServicePassword: string;
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
        projectServicePassword,
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
                    "startTime": service.startedAt
                })
                    ? "warning"
                    : "success";
        }

        assert<Equals<typeof service.state, never>>(false);
    }, [service]);

    const { classes, cx, theme } = useStyles({
        "hasBeenRunningForTooLong": severity === "warning"
    });

    const evtOpenReadmeDialog = useConst(() => Evt.create());

    useEvt(
        ctx => {
            evtAction.attach(
                action => action === "open readme dialog",
                ctx,
                async () => {
                    if (!service.postInstallInstructions !== undefined) {
                        return;
                    }
                    evtOpenReadmeDialog.post();
                }
            );
        },
        [evtAction]
    );

    return (
        <div className={cx(classes.root, className)}>
            <a className={classes.aboveDivider} {...myServiceLink}>
                <MyServicesRoundLogo url={service.iconUrl} severity={severity} />
                <Text className={classes.title} typo="object heading">
                    {capitalize(service.friendlyName)}
                </Text>
                <div style={{ "flex": 1 }} />
                {service.doesSupportSuspend && service.state === "running" && (
                    <Tooltip title={"Click to suspend the service and release resources"}>
                        <IconButton
                            disabled={service.areInteractionLocked}
                            icon={id<MuiIconComponentName>("Pause")}
                            onClick={event => {
                                onRequestPauseOrResume();
                                event.stopPropagation();
                                event.preventDefault();
                            }}
                        />
                    </Tooltip>
                )}
                {service.ownership.isShared && (
                    <Tooltip title={t("this is a shared service")}>
                        <Icon icon={id<MuiIconComponentName>("People")} />
                    </Tooltip>
                )}
                <Tooltip
                    title={
                        <Fragment key={"reminder"}>
                            {t("reminder to delete services")}
                        </Fragment>
                    }
                >
                    <Icon
                        icon={id<MuiIconComponentName>("ErrorOutline")}
                        className={classes.errorOutlineIcon}
                    />
                </Tooltip>
            </a>
            <div className={classes.belowDivider}>
                <div className={classes.belowDividerTop}>
                    <div>
                        <Text typo="caption" className={classes.captions}>
                            {t("service")}
                        </Text>
                        <div className={classes.packageNameWrapper}>
                            <Text typo="label 1">{capitalize(service.chartName)}</Text>
                            {service.ownership.isShared && (
                                <Tag
                                    className={classes.sharedTag}
                                    text={
                                        service.ownership.isOwned
                                            ? t("shared by you")
                                            : service.ownership.ownerUsername
                                    }
                                />
                            )}
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
                                    return <Text typo="label 1">{"Suspended"}</Text>;
                                case "suspending":
                                    return <Text typo="label 1">{"Suspending..."}</Text>;
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
                                                { "startTime": service.startedAt }
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
                            icon={id<MuiIconComponentName>("Delete")}
                            onClick={onRequestDelete}
                        />
                    )}
                    <div style={{ "flex": 1 }} />

                    {service.state === "suspended" && (
                        <Tooltip title={"Click to resume the service"}>
                            <IconButton
                                disabled={service.areInteractionLocked}
                                icon={id<MuiIconComponentName>("PlayArrow")}
                                onClick={onRequestPauseOrResume}
                            />
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
                projectServicePassword={projectServicePassword}
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
    | "shared by you"
    | "reminder to delete services"
    | "this is a shared service"
    | "status"
    | "container starting"
    | "pending" //TODO: Remove
    | "failed"
>()({ MyServicesCard });
export type I18n = typeof i18n;

const useStyles = tss
    .withParams<{
        hasBeenRunningForTooLong: boolean;
    }>()
    .withName({ MyServicesCard })
    .withNestedSelectors<"title">()
    .create(({ theme, hasBeenRunningForTooLong, classes }) => ({
        "root": {
            "borderRadius": 8,
            "boxShadow": theme.shadows[1],
            "backgroundColor": theme.colors.useCases.surfaces.surface1,
            "&:hover": {
                "boxShadow": theme.shadows[6]
            },
            "display": "flex",
            "flexDirection": "column"
        },
        "aboveDivider": {
            "padding": theme.spacing({ "topBottom": 3, "rightLeft": 4 }),
            "borderBottom": `1px solid ${theme.colors.useCases.typography.textTertiary}`,
            "boxSizing": "border-box",
            "display": "flex",
            "alignItems": "center",
            "color": "inherit",
            "textDecoration": "none",
            [`&:hover .${classes.title}`]: {
                "color": theme.colors.useCases.typography.textFocus
            }
        },
        "title": {
            "marginLeft": theme.spacing(3)
        },
        "errorOutlineIcon": !hasBeenRunningForTooLong
            ? { "display": "none" }
            : {
                  "marginLeft": theme.spacing(3),
                  "color": theme.colors.useCases.alertSeverity.warning.main
              },
        "belowDivider": {
            "padding": theme.spacing(4),
            "paddingTop": theme.spacing(3),
            "flex": 1
        },
        "timeAndStatusContainer": {
            "flex": 1,
            "paddingLeft": theme.spacing(6)
        },
        "circularProgress": {
            "color": "inherit",
            "position": "relative",
            "top": 3,
            "left": theme.spacing(2)
        },
        "belowDividerTop": {
            "display": "flex",
            "marginBottom": theme.spacing(4)
        },
        "captions": {
            "display": "inline-block",
            "marginBottom": theme.spacing(2)
        },
        "packageNameWrapper": {
            "& > *": {
                "display": "inline-block"
            }
        },
        "sharedTag": {
            "marginLeft": theme.spacing(2)
        },
        "belowDividerBottom": {
            "display": "flex",
            "alignItems": "center"
        }
    }));
