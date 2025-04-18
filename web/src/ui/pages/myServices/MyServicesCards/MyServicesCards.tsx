import { useMemo, memo } from "react";
import { MyServicesCard } from "./MyServicesCard";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { useTranslation } from "ui/i18n";
import type { Link } from "type-route";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { declareComponentKeys } from "i18nifty";
import memoize from "memoizee";
import { Evt } from "evt";
import { NoRunningService } from "./NoRunningService";
import type { Service } from "core/usecases/serviceManagement";

export type Props = {
    className?: string;
    isUpdating: boolean;
    services: Service[] | undefined;
    getMyServiceLink: (params: { helmReleaseName: string }) => Link;
    catalogExplorerLink: Link;
    onRequestDelete(params: { helmReleaseName: string }): void;
    onRequestPauseOrResume: (params: { helmReleaseName: string }) => void;
    onRequestLogHelmGetNotes: (params: { helmReleaseName: string }) => void;
    onRequestChangeFriendlyName: (params: {
        helmReleaseName: string;
        friendlyName: string;
    }) => void;
    onRequestChangeSharedStatus: (params: {
        helmReleaseName: string;
        isShared: boolean;
    }) => void;
    evtAction: NonPostableEvt<{
        action: "open readme dialog";
        helmReleaseName: string;
    }>;
    lastClusterEvent:
        | { message: string; severity: "error" | "info" | "warning" }
        | undefined;
    onOpenClusterEventsDialog: () => void;
    groupProjectName: string | undefined;
};

export const MyServicesCards = memo((props: Props) => {
    const {
        className,
        services,
        getMyServiceLink,
        catalogExplorerLink,
        isUpdating,
        onRequestDelete,
        onRequestPauseOrResume,
        onRequestLogHelmGetNotes,
        onRequestChangeFriendlyName,
        evtAction,
        lastClusterEvent,
        onOpenClusterEventsDialog,
        onRequestChangeSharedStatus,
        groupProjectName
    } = props;

    const { classes, cx } = useStyles({
        isThereServices: services !== undefined && services.length !== 0
    });

    const { t } = useTranslation({ MyServicesCards });

    const getMyServicesFunctionProps = useMemo(
        () =>
            memoize((helmReleaseName: string) => ({
                onRequestLogHelmGetNotes: () =>
                    onRequestLogHelmGetNotes({ helmReleaseName }),
                onRequestDelete: () => onRequestDelete({ helmReleaseName }),
                onRequestPauseOrResume: () => onRequestPauseOrResume({ helmReleaseName }),
                onRequestChangeFriendlyName: (friendlyName: string) =>
                    onRequestChangeFriendlyName({ helmReleaseName, friendlyName }),
                myServiceLink: getMyServiceLink({ helmReleaseName }),
                onRequestChangeSharedStatus: (isShared: boolean) =>
                    onRequestChangeSharedStatus({ helmReleaseName, isShared }),
                evtAction: Evt.create<"open readme dialog">()
            })),
        [
            onRequestLogHelmGetNotes,
            onRequestChangeFriendlyName,
            onRequestDelete,
            onRequestPauseOrResume,
            onRequestChangeSharedStatus,
            getMyServiceLink
        ]
    );

    useEvt(
        ctx => {
            evtAction.$attach(
                action =>
                    action.action !== "open readme dialog"
                        ? null
                        : [action.helmReleaseName],
                ctx,
                helmReleaseName =>
                    getMyServicesFunctionProps(helmReleaseName).evtAction.post(
                        "open readme dialog"
                    )
            );
        },
        [evtAction, getMyServicesFunctionProps]
    );

    return (
        <div className={cx(classes.root, className)}>
            <Text typo="section heading" className={classes.header}>
                {t("running services")}
                &nbsp; &nbsp;
                {isUpdating && <CircularProgress color="textPrimary" size={20} />}
            </Text>
            <div className={classes.wrapper}>
                {(() => {
                    if (services === undefined) {
                        return null;
                    }

                    if (services.length === 0) {
                        return (
                            <NoRunningService
                                className={classes.noRunningServices}
                                catalogExplorerLink={catalogExplorerLink}
                            />
                        );
                    }

                    return services.map(service => {
                        const {
                            onRequestLogHelmGetNotes,
                            onRequestChangeFriendlyName,
                            onRequestDelete,
                            onRequestPauseOrResume,
                            onRequestChangeSharedStatus,
                            myServiceLink,
                            evtAction
                        } = getMyServicesFunctionProps(service.helmReleaseName);

                        return (
                            <MyServicesCard
                                key={service.helmReleaseName}
                                evtAction={evtAction}
                                onRequestDelete={onRequestDelete}
                                onRequestPauseOrResume={onRequestPauseOrResume}
                                onRequestLogHelmGetNotes={onRequestLogHelmGetNotes}
                                onRequestChangeFriendlyName={onRequestChangeFriendlyName}
                                myServiceLink={myServiceLink}
                                lastClusterEvent={lastClusterEvent}
                                onOpenClusterEventsDialog={onOpenClusterEventsDialog}
                                service={service}
                                groupProjectName={groupProjectName}
                                onRequestChangeSharedStatus={onRequestChangeSharedStatus}
                            />
                        );
                    });
                })()}
            </div>
        </div>
    );
});

const { i18n } = declareComponentKeys<"running services">()({ MyServicesCards });
export type I18n = typeof i18n;

const useStyles = tss
    .withParams<{ isThereServices: boolean }>()
    .withName({ MyServicesCards })
    .create(({ theme, isThereServices }) => ({
        root: {
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
        },
        header: {
            ...theme.spacing.topBottom("margin", 3)
        },
        wrapper: {
            overflow: "auto",
            ...(!isThereServices
                ? {
                      flex: 1
                  }
                : {
                      paddingRight: theme.spacing(3),
                      display: "grid",
                      gridTemplateColumns: "repeat(2,1fr)",
                      gap: theme.spacing(4)
                  }),
            paddingBottom: theme.spacing(4)
        },
        noRunningServices: {
            height: "100%"
        }
    }));
