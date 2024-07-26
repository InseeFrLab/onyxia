import { useEffect, useMemo, useState } from "react";
import { tss } from "tss";
import { PageHeader } from "onyxia-ui/PageHeader";
import { useTranslation } from "ui/i18n";
import { MyServicesButtonBar } from "./MyServicesButtonBar";
import { MyServicesCards } from "./MyServicesCards";
import type { Props as MyServicesCardsProps } from "./MyServicesCards";
import {
    MyServicesRestorableConfigs,
    type Props as MyServicesRestorableConfigsProps
} from "./MyServicesRestorableConfigs";
import { ButtonId } from "./MyServicesButtonBar";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useCoreState, useCore } from "core";
import { routes } from "ui/routes";
import { useConst } from "powerhooks/useConst";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { declareComponentKeys } from "i18nifty";
import type { PageRoute } from "./route";
import { CommandBar } from "ui/shared/CommandBar";
import { useDomRect } from "powerhooks/useDomRect";
import {
    MyServicesConfirmDeleteDialog,
    type Props as MyServicesConfirmDeleteDialogProps
} from "./MyServicesConfirmDeleteDialog";
import { Deferred } from "evt/tools/Deferred";
import { customIcons } from "ui/theme";
import { Quotas } from "./Quotas";
import { assert, type Equals } from "tsafe/assert";
import { ClusterEventsDialog } from "./ClusterEventsDialog";
import {
    ClusterEventsSnackbar,
    type ClusterEventsSnackbarProps
} from "./ClusterEventsSnackbar";
import { useEvt } from "evt/hooks";

export type Props = {
    route: PageRoute;
    className?: string;
};

export default function MyServices(props: Props) {
    const { className, route } = props;

    const { t } = useTranslation({ MyServices });
    const { t: tCatalogLauncher } = useTranslation("Launcher");

    /* prettier-ignore */
    const { serviceManagement, restorableConfigManagement, k8sCodeSnippets, clusterEventsMonitor } = useCore().functions;
    /* prettier-ignore */
    const { restorableConfigs, chartIconAndFriendlyNameByRestorableConfigIndex } = useCoreState("restorableConfigManagement", "main");
    const {
        isUpdating,
        services,
        isThereOwnedSharedServices,
        commandLogsEntries,
        isThereNonOwnedServices,
        isThereDeletableServices
    } = useCoreState("serviceManagement", "main");

    const { isCommandBarEnabled } = useCoreState("userConfigs", "userConfigs");
    const servicePassword = useCoreState("projectManagement", "servicePassword");

    const evtQuotasActionUpdate = useConst(() => Evt.create());

    const eventsNotificationCount = useCoreState(
        "clusterEventsMonitor",
        "notificationsCount"
    );

    const lastClusterEvent = useCoreState("clusterEventsMonitor", "lastClusterEvent");

    const evtClusterEventsDialogOpen = useConst(() => Evt.create<void>());

    const onButtonBarClick = useConstCallback(async (buttonId: ButtonId) => {
        switch (buttonId) {
            case "launch":
                routes.catalog().push();
                return;
            case "refresh":
                serviceManagement.update();
                evtQuotasActionUpdate.post();
                return;
            case "trash": {
                const dDoProceed = new Deferred<boolean>();

                evtConfirmDeleteDialogOpen.post({
                    isThereOwnedSharedServices,
                    "resolveDoProceed": dDoProceed.resolve
                });

                if (!(await dDoProceed.pr)) {
                    return;
                }

                serviceManagement.deleteAllServices();

                return;
            }
            case "events":
                evtClusterEventsDialogOpen.post();
                return;
        }
        assert<Equals<typeof buttonId, never>>(false);
    });

    useEffect(() => {
        const { setInactive } = serviceManagement.setActive();
        return () => setInactive();
    }, []);

    useEffect(() => {
        const { setInactive } = clusterEventsMonitor.setActive();
        return () => setInactive();
    }, []);

    const { isSavedConfigsExtended } = route.params;

    const {
        rootRef: belowHeaderRef,
        buttonBarRef,
        commandBarTop,
        commandBarMaxHeight
    } = useCommandBarPositioning();

    const {
        domRect: { height: bellowHeaderHeight }
    } = useDomRect({ "ref": belowHeaderRef });

    const { classes, cx } = useStyles({
        isSavedConfigsExtended,
        commandBarTop,
        isCommandBarEnabled,
        bellowHeaderHeight
    });

    const onRequestToggleIsShortVariant = useConstCallback(() =>
        routes
            .myServices({
                "isSavedConfigsExtended": !isSavedConfigsExtended ? true : undefined
            })
            .push()
    );

    const onRequestDeleteRestorableConfig = useConstCallback<
        MyServicesRestorableConfigsProps["onRequestDelete"]
    >(({ restorableConfigIndex }) => {
        restorableConfigManagement.deleteRestorableConfig({
            "restorableConfig": restorableConfigs[restorableConfigIndex]
        });
    });

    const restorableConfigEntires = useMemo(
        (): MyServicesRestorableConfigsProps["entries"] =>
            restorableConfigs.map((restorableConfig, restorableConfigIndex) => {
                const buildLink = (autoLaunch: boolean) =>
                    routes.launcher({
                        "catalogId": restorableConfig.catalogId,
                        "chartName": restorableConfig.chartName,
                        "version": restorableConfig.chartVersion,
                        "formFieldsValueDifferentFromDefault":
                            restorableConfig.formFieldsValueDifferentFromDefault,
                        "autoLaunch": autoLaunch ? true : undefined
                    }).link;

                const { chartIconUrl, friendlyName } =
                    chartIconAndFriendlyNameByRestorableConfigIndex[
                        restorableConfigIndex
                    ];

                return {
                    restorableConfigIndex,
                    chartIconUrl,
                    friendlyName,
                    "launchLink": buildLink(true),
                    "editLink": buildLink(false)
                };
            }),
        [restorableConfigs, chartIconAndFriendlyNameByRestorableConfigIndex]
    );

    const getMyServiceLink = useConstCallback<MyServicesCardsProps["getMyServiceLink"]>(
        ({ helmReleaseName }) => routes.myService({ helmReleaseName }).link
    );

    const evtMyServiceCardsAction = useConst(() =>
        Evt.create<UnpackEvt<MyServicesCardsProps["evtAction"]>>()
    );

    useEffect(() => {
        const { autoOpenHelmReleaseName } = route.params;

        if (autoOpenHelmReleaseName === undefined) {
            return;
        }

        const service = services.find(
            ({ helmReleaseName }) => helmReleaseName === autoOpenHelmReleaseName
        );

        if (service === undefined) {
            return;
        }

        routes
            .myServices({
                ...route.params,
                "autoOpenHelmReleaseName": undefined
            })
            .replace();

        evtMyServiceCardsAction.post({
            "action": "open readme dialog",
            "helmReleaseName": service.helmReleaseName
        });
    }, [route.params.autoOpenHelmReleaseName, services]);

    const catalogExplorerLink = useMemo(() => routes.catalog().link, []);

    const evtConfirmDeleteDialogOpen = useConst(() =>
        Evt.create<UnpackEvt<MyServicesConfirmDeleteDialogProps["evtOpen"]>>()
    );

    const onRequestDelete = useConstCallback<MyServicesCardsProps["onRequestDelete"]>(
        async ({ helmReleaseName }) => {
            const dDoProceed = new Deferred<boolean>();

            evtConfirmDeleteDialogOpen.post({
                isThereOwnedSharedServices,
                "resolveDoProceed": dDoProceed.resolve
            });

            if (!(await dDoProceed.pr)) {
                return;
            }

            serviceManagement.deleteService({ helmReleaseName });
        }
    );

    const onRequestPauseOrResume = useConstCallback<
        MyServicesCardsProps["onRequestPauseOrResume"]
    >(async ({ helmReleaseName }) =>
        serviceManagement.suspendOrResumeService({ "helmReleaseName": helmReleaseName })
    );

    const onOpenClusterEventsDialog = useConstCallback(() => {
        evtClusterEventsDialogOpen.post();
    });

    const { evtClusterEventsMonitor } = useCore().evts;

    const evtClusterEventsSnackbarAction = useConst(() =>
        Evt.create<UnpackEvt<ClusterEventsSnackbarProps["evtAction"]>>()
    );

    useEvt(
        ctx => {
            evtClusterEventsMonitor.$attach(
                action =>
                    action.actionName === "display notification" ? [action] : null,
                ctx,
                ({ message, severity }) => {
                    evtClusterEventsSnackbarAction.post({
                        "action": "show notification",
                        message,
                        severity
                    });
                }
            );
        },
        [evtClusterEventsMonitor]
    );

    return (
        <>
            <div className={cx(classes.root, className)}>
                <PageHeader
                    mainIcon={customIcons.servicesSvgUrl}
                    title={t("text1")}
                    helpTitle={t("text2")}
                    helpContent={t("text3")}
                    helpIcon="sentimentSatisfied"
                />
                <div className={classes.belowHeader} ref={belowHeaderRef}>
                    <div ref={buttonBarRef}>
                        <MyServicesButtonBar
                            onClick={onButtonBarClick}
                            isThereNonOwnedServicesShown={isThereNonOwnedServices}
                            isThereDeletableServices={isThereDeletableServices}
                            eventsNotificationCount={eventsNotificationCount}
                        />
                    </div>
                    {isCommandBarEnabled && (
                        <CommandBar
                            classes={{
                                "root": classes.commandBar,
                                "rootWhenExpended": classes.commandBarWhenExpended
                            }}
                            entries={commandLogsEntries}
                            maxHeight={commandBarMaxHeight}
                            helpDialog={{
                                "body": tCatalogLauncher("api logs help body", {
                                    "k8CredentialsHref": !k8sCodeSnippets.getIsAvailable()
                                        ? undefined
                                        : routes.account({
                                              "tabId": "k8sCodeSnippets"
                                          }).href,
                                    "myServicesHref": routes.myServices().href,
                                    "interfacePreferenceHref": routes.account({
                                        "tabId": "user-interface"
                                    }).href
                                })
                            }}
                        />
                    )}
                    <div className={classes.cardsAndSavedConfigs}>
                        <>
                            {!isSavedConfigsExtended && (
                                <MyServicesCards
                                    className={classes.cards}
                                    isUpdating={isUpdating}
                                    services={services}
                                    getMyServiceLink={getMyServiceLink}
                                    catalogExplorerLink={catalogExplorerLink}
                                    onRequestDelete={onRequestDelete}
                                    onRequestPauseOrResume={onRequestPauseOrResume}
                                    onRequestLogHelmGetNotes={
                                        serviceManagement.logHelmGetNotes
                                    }
                                    evtAction={evtMyServiceCardsAction}
                                    projectServicePassword={servicePassword}
                                    lastClusterEvent={lastClusterEvent}
                                    onOpenClusterEventsDialog={onOpenClusterEventsDialog}
                                />
                            )}
                            <div className={classes.rightPanel}>
                                {!isSavedConfigsExtended && (
                                    <Quotas evtActionUpdate={evtQuotasActionUpdate} />
                                )}
                                <MyServicesRestorableConfigs
                                    isShortVariant={!isSavedConfigsExtended}
                                    entries={restorableConfigEntires}
                                    onRequestDelete={onRequestDeleteRestorableConfig}
                                    onRequestToggleIsShortVariant={
                                        onRequestToggleIsShortVariant
                                    }
                                />
                            </div>
                        </>
                    </div>
                    <MyServicesConfirmDeleteDialog evtOpen={evtConfirmDeleteDialogOpen} />
                </div>
            </div>
            <ClusterEventsDialog evtOpen={evtClusterEventsDialogOpen} />
            <ClusterEventsSnackbar
                evtAction={evtClusterEventsSnackbarAction}
                onOpenClusterEventsDialog={onOpenClusterEventsDialog}
            />
        </>
    );
}

function useCommandBarPositioning() {
    const {
        domRect: { bottom: rootBottom },
        ref: rootRef
    } = useDomRect();

    // NOTE: To avoid https://reactjs.org/docs/hooks-reference.html#useimperativehandle
    const {
        domRect: { height: buttonBarHeight, bottom: buttonBarBottom },
        ref: buttonBarRef
    } = useDomRect();

    const [commandBarTop, setCommandBarTop] = useState<number>(0);

    const [commandBarMaxHeight, setCommandBarMaxHeight] = useState<number>(0);

    useEffect(() => {
        setCommandBarTop(buttonBarHeight);

        setCommandBarMaxHeight(rootBottom - buttonBarBottom - 30);
    }, [buttonBarHeight, buttonBarBottom, rootBottom]);

    return {
        rootRef,
        buttonBarRef,
        commandBarTop,
        commandBarMaxHeight
    };
}

const { i18n } = declareComponentKeys<"text1" | "text2" | "text3" | "running services">()(
    { MyServices }
);
export type I18n = typeof i18n;

const useStyles = tss
    .withName({ MyServices })
    .withParams<{
        isCommandBarEnabled: boolean;
        commandBarTop: number;
        isSavedConfigsExtended: boolean;
    }>()
    .create(({ theme, isCommandBarEnabled, isSavedConfigsExtended, commandBarTop }) => ({
        "root": {
            "height": "100%",
            "display": "flex",
            "flexDirection": "column"
        },
        "belowHeader": {
            "position": "relative",
            "flex": 1,
            "display": "flex",
            "flexDirection": "column",
            "overflow": "hidden"
        },
        "cardsAndSavedConfigs": {
            "overflow": "hidden",
            "flex": 1,
            "display": "flex"
        },
        ...(() => {
            const ratio = 0.6;

            return {
                "cards": {
                    "flex": ratio,
                    "marginRight": theme.spacing(5)
                },
                "rightPanel": {
                    "flex": isSavedConfigsExtended ? 1 : 1 - ratio,
                    "paddingRight": "2%",
                    //NOTE: It's not great to have a fixed width here but measuring would needlessly complexity the code too much.
                    "marginTop": isCommandBarEnabled ? 40 : undefined,
                    "height": `calc(100% - ${commandBarTop}px)`,
                    "overflow": "auto"
                }
            };
        })(),
        "commandBar": {
            "position": "absolute",
            "right": 0,
            "top": commandBarTop,
            "zIndex": 1,
            "opacity": commandBarTop === 0 ? 0 : 1,
            "transition": "opacity 750ms linear",
            "width": "min(100%, 900px)"
        },
        "commandBarWhenExpended": {
            "width": "min(100%, 1350px)",
            "transition": "width 70ms linear"
        }
    }));
