import { useMemo, memo } from "react";
import { MyServicesCard } from "./MyServicesCard";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { useTranslation } from "ui/i18n";
import type { Link } from "type-route";
import { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { declareComponentKeys } from "i18nifty";
import memoize from "memoizee";
import { Evt } from "evt";
import { NoRunningService } from "./NoRunningService";
import type { RunningService } from "core/usecases/serviceManagement/state";

export type Props = {
    className?: string;
    isUpdating: boolean;
    runningServices: RunningService[] | undefined;
    getMyServiceLink: (params: { helmReleaseName: string }) => Link;
    catalogExplorerLink: Link;
    onRequestDelete(params: { helmReleaseName: string }): void;
    onRequestPauseOrResume: (params: { helmReleaseName: string }) => void;
    getPostInstallInstructions: (params: { helmReleaseName: string }) => string;
    evtAction: NonPostableEvt<{
        action: "open readme dialog";
        helmReleaseName: string;
    }>;
    projectServicePassword: string;
    lastClusterEvent:
        | { message: string; severity: "error" | "info" | "warning" }
        | undefined;
    onOpenClusterEventsDialog: () => void;
};

export const MyServicesCards = memo((props: Props) => {
    const {
        className,
        runningServices,
        getMyServiceLink,
        catalogExplorerLink,
        isUpdating,
        onRequestDelete,
        onRequestPauseOrResume,
        getPostInstallInstructions,
        evtAction,
        projectServicePassword,
        lastClusterEvent,
        onOpenClusterEventsDialog
    } = props;

    const { classes, cx } = useStyles({
        "isThereServicesRunning":
            runningServices !== undefined && runningServices.length !== 0
    });

    const { t } = useTranslation({ MyServicesCards });

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
        [evtAction, runningServices]
    );

    const getMyServicesFunctionProps = useMemo(
        () =>
            memoize((helmReleaseName: string) => ({
                "getPoseInstallInstructions": () =>
                    getPostInstallInstructions({ helmReleaseName }),
                "onRequestDelete": () => onRequestDelete({ helmReleaseName }),
                "onRequestPauseOrResume": () =>
                    onRequestPauseOrResume({ helmReleaseName }),
                "myServiceLink": getMyServiceLink({ helmReleaseName }),
                "evtAction": Evt.create<"open readme dialog">()
            })),
        [
            getPostInstallInstructions,
            onRequestDelete,
            onRequestPauseOrResume,
            getMyServiceLink
        ]
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
                    if (runningServices === undefined) {
                        return null;
                    }

                    if (runningServices.length === 0) {
                        return (
                            <NoRunningService
                                className={classes.noRunningServices}
                                catalogExplorerLink={catalogExplorerLink}
                            />
                        );
                    }

                    return runningServices.map(runningService => {
                        const {
                            getPoseInstallInstructions,
                            onRequestDelete,
                            onRequestPauseOrResume,
                            myServiceLink,
                            evtAction
                        } = getMyServicesFunctionProps(runningService.helmReleaseName);

                        return (
                            <MyServicesCard
                                key={runningService.helmReleaseName}
                                evtAction={evtAction}
                                getPoseInstallInstructions={getPoseInstallInstructions}
                                onRequestDelete={onRequestDelete}
                                lastClusterEvent={lastClusterEvent}
                                onOpenClusterEventsDialog={onOpenClusterEventsDialog}
                                onRequestPauseOrResume={onRequestPauseOrResume}
                                myServiceLink={myServiceLink}
                                projectServicePassword={projectServicePassword}
                                runningService={runningService}
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
    .withParams<{ isThereServicesRunning: boolean }>()
    .withName({ MyServicesCards })
    .create(({ theme, isThereServicesRunning }) => ({
        "root": {
            "overflow": "hidden",
            "display": "flex",
            "flexDirection": "column"
        },
        "header": {
            ...theme.spacing.topBottom("margin", 3)
        },
        "wrapper": {
            "overflow": "auto",
            ...(!isThereServicesRunning
                ? {
                      "flex": 1
                  }
                : {
                      "paddingRight": theme.spacing(3),
                      "display": "grid",
                      "gridTemplateColumns": "repeat(2,1fr)",
                      "gap": theme.spacing(4)
                  }),
            "paddingBottom": theme.spacing(4)
        },
        "noRunningServices": {
            "height": "100%"
        }
    }));
